import "server-only";

import { getCurrentSupabaseClient } from "@/lib/supabase/auctions";
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

export async function uploadAuctionPhotos(auctionId: string, files: File[]) {
  const validation = validateAuctionPhotos(files);
  if (validation) throw new Error(`Invalid auction photos: ${validation}`);
  const supabase = await getCurrentSupabaseClient();
  const uploadedPaths: string[] = [];
  const existing = await supabase.from("auction_photos").select("sort_order").eq("auction_id", auctionId);
  if (existing.error) throw existing.error;
  const usedOrders = new Set(existing.data.map((photo) => photo.sort_order));
  const availableOrders = Array.from({ length: MAX_AUCTION_PHOTOS }, (_, index) => index).filter((index) => !usedOrders.has(index));
  if (files.length > availableOrders.length) throw new Error("Too many auction photos.");

  try {
    for (const [index, file] of files.entries()) {
      const extension = extensionByType[file.type as keyof typeof extensionByType];
      const path = `${auctionId}/${crypto.randomUUID()}.${extension}`;
      const upload = await supabase.storage.from("auction-photos").upload(path, file, { contentType: file.type, upsert: false });
      if (upload.error) throw upload.error;
      uploadedPaths.push(path);
      const metadata = await supabase.from("auction_photos").insert({ auction_id: auctionId, storage_path: path, sort_order: availableOrders[index] });
      if (metadata.error) throw metadata.error;
    }
    return uploadedPaths;
  } catch (error) {
    if (uploadedPaths.length) {
      await supabase.from("auction_photos").delete().in("storage_path", uploadedPaths);
      await supabase.storage.from("auction-photos").remove(uploadedPaths);
    }
    throw error;
  }
}

export async function removeAuctionPhotos(paths: string[]) {
  if (!paths.length) return;
  const supabase = await getCurrentSupabaseClient();
  const storage = await supabase.storage.from("auction-photos").remove(paths);
  if (storage.error) throw storage.error;
  if (!storage.data || storage.data.length !== paths.length) {
    throw new Error("Storage did not remove every requested auction photo.");
  }
  const metadata = await supabase.from("auction_photos").delete().in("storage_path", paths);
  if (metadata.error) throw metadata.error;
}

export async function removeAllAuctionPhotoObjects(auctionId: string) {
  const supabase = await getCurrentSupabaseClient();
  const listed = await supabase.storage.from("auction-photos").list(auctionId, { limit: 100 });
  if (listed.error) throw listed.error;
  const paths = listed.data.filter((object) => object.id).map((object) => `${auctionId}/${object.name}`);
  if (paths.length) {
    const removed = await supabase.storage.from("auction-photos").remove(paths);
    if (removed.error) throw removed.error;
    if (!removed.data || removed.data.length !== paths.length) {
      throw new Error("Storage did not remove every auction object.");
    }
  }
  const metadata = await supabase.from("auction_photos").delete().eq("auction_id", auctionId);
  if (metadata.error) throw metadata.error;
}

