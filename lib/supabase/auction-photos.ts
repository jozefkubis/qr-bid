import "server-only";

import { auth } from "@clerk/nextjs/server";
import { currentSupabaseClient, type OwnedAuction } from "@/lib/supabase/auctions";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
export { getAuctionPhotoUrl } from "@/lib/supabase/public-storage";

export const MAX_AUCTION_PHOTOS = 5;
export const MAX_AUCTION_PHOTO_BYTES = 5 * 1024 * 1024;
export const AUCTION_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const extensionByType: Record<(typeof AUCTION_PHOTO_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function validateAuctionPhotos(files: File[]) {
  if (files.length > MAX_AUCTION_PHOTOS) return "count" as const;
  if (files.some((file) => !AUCTION_PHOTO_TYPES.includes(file.type as (typeof AUCTION_PHOTO_TYPES)[number]))) return "type" as const;
  if (files.some((file) => file.size <= 0 || file.size > MAX_AUCTION_PHOTO_BYTES)) return "size" as const;
  return null;
}

function auctionPhotoBucket() {
  return createSupabaseAdminClient().storage.from("auction-photos");
}

async function removeUnreferencedObjects(bucket: ReturnType<typeof auctionPhotoBucket>, paths: string[]) {
  if (paths.length === 0) return;
  const first = await bucket.remove(paths);
  if (!first.error) return;
  const retry = await bucket.remove(paths);
  if (retry.error) throw retry.error;
}

async function changePhotoReferences(auctionId: string, addPaths: string[], removePath: string | null) {
  const { userId } = await auth();
  if (!userId) return false;
  const { data, error } = await createSupabaseAdminClient().rpc("change_owned_auction_photos", {
    p_auction_id: auctionId,
    p_owner_sub: userId,
    p_add_paths: addPaths,
    p_remove_path: removePath,
  });
  if (error) throw error;
  return data;
}

export async function uploadAuctionPhotos(auction: OwnedAuction, files: File[]) {
  if (files.length === 0) return true;
  const validation = validateAuctionPhotos(files);
  if (validation) throw new Error(`Invalid auction photos: ${validation}`);
  const legacyClient = auction.supportsCancellation ? null : await currentSupabaseClient();
  const bucket = legacyClient ? legacyClient.storage.from("auction-photos") : auctionPhotoBucket();
  const attemptedPaths: string[] = [];

  try {
    for (const file of files) {
      const extension = extensionByType[file.type as keyof typeof extensionByType];
      const path = `${auction.id}/${crypto.randomUUID()}.${extension}`;
      attemptedPaths.push(path);
      const { error } = await bucket.upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
    }
  } catch (error) {
    await removeUnreferencedObjects(bucket, attemptedPaths).catch(console.error);
    throw error;
  }

  if (legacyClient) {
    const existing = await legacyClient.from("auction_photos").select("sort_order").eq("auction_id", auction.id);
    if (existing.error) {
      await removeUnreferencedObjects(bucket, attemptedPaths).catch(console.error);
      throw existing.error;
    }
    const occupied = new Set(existing.data.map(({ sort_order }) => sort_order));
    const slots = Array.from({ length: MAX_AUCTION_PHOTOS }, (_, index) => index).filter((index) => !occupied.has(index));
    if (slots.length < attemptedPaths.length) {
      await removeUnreferencedObjects(bucket, attemptedPaths).catch(console.error);
      return false;
    }
    const { error } = await legacyClient.from("auction_photos").insert(
      attemptedPaths.map((path, index) => ({ auction_id: auction.id, storage_path: path, sort_order: slots[index] })),
    );
    if (error) throw error;
    return true;
  }

  // On an ambiguous RPC failure, keep the files: the references may have committed.
  const published = await changePhotoReferences(auction.id, attemptedPaths, null);
  if (!published) await removeUnreferencedObjects(bucket, attemptedPaths).catch(console.error);
  return published;
}

export async function removeAuctionPhoto(auction: OwnedAuction, path: string) {
  if (!auction.supportsCancellation) {
    const client = await currentSupabaseClient();
    const { data, error } = await client.storage.from("auction-photos").remove([path]);
    if (error) throw error;
    if (data.length !== 1) return false;
    const metadata = await client.from("auction_photos").delete().eq("auction_id", auction.id).eq("storage_path", path);
    if (metadata.error) throw metadata.error;
    return true;
  }
  const bucket = auctionPhotoBucket();
  if (!await changePhotoReferences(auction.id, [], path)) return false;
  await removeUnreferencedObjects(bucket, [path]);
  return true;
}

export async function removeAuctionPhotoObjects(auction: OwnedAuction) {
  const legacyClient = auction.supportsCancellation ? null : await currentSupabaseClient();
  const bucket = legacyClient ? legacyClient.storage.from("auction-photos") : auctionPhotoBucket();
  const auctionId = auction.id;
  const listed = await bucket.list(auctionId, { limit: 100 });
  if (listed.error) throw listed.error;
  const paths = listed.data.filter((object) => object.id).map((object) => `${auctionId}/${object.name}`);
  await removeUnreferencedObjects(bucket, paths);
  const remaining = await bucket.list(auctionId, { limit: 1 });
  if (remaining.error) throw remaining.error;
  if (remaining.data.length > 0) throw new Error("Storage did not remove every auction object.");
  if (legacyClient) {
    const metadata = await legacyClient.from("auction_photos").delete().eq("auction_id", auctionId);
    if (metadata.error) throw metadata.error;
  }
}
