"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cancellationReasonLimit, type CancelAuctionState } from "@/lib/auction-cancellation";
import { completeAuctionSale, continueWithNextAuctionCandidate } from "@/lib/supabase/auction-results";
import { addCurrentUserAuctionNote, cancelCurrentUserAuction, deleteCurrentUserAuction, getCurrentUserAuction, updateCurrentUserAuction } from "@/lib/supabase/auctions";
import { MAX_AUCTION_PHOTOS, removeAuctionPhotoObjects, removeAuctionPhoto, uploadAuctionPhotos, validateAuctionPhotos } from "@/lib/supabase/auction-photos";

const maxMinorAmount = BigInt(Number.MAX_SAFE_INTEGER);
const safeLocale = (locale: string) => locale === "sk" ? "sk" : "en";
const text = (data: FormData, name: string) => typeof data.get(name) === "string" ? String(data.get(name)).trim() : "";
function moneyToMinor(value: string) {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  const minor = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  return minor >= BigInt(1) && minor <= maxMinorAmount ? Number(minor) : null;
}
function target(locale: string, id: string, status: string) {
  return `/${safeLocale(locale)}/my-auctions/${id}?status=${status}`;
}

export async function updateAuctionAction(locale: string, id: string, data: FormData) {
  const title = text(data, "title");
  const description = text(data, "description");
  const location = text(data, "location");
  const startingPriceMinor = moneyToMinor(text(data, "startingPrice"));
  const minimumIncrementMinor = moneyToMinor(text(data, "minimumIncrement"));
  const endsAt = new Date(text(data, "endsAt"));
  if (title.length < 3 || title.length > 120 || description.length > 5000 || location.length < 2 || location.length > 120 || startingPriceMinor === null || minimumIncrementMinor === null || Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= Date.now()) redirect(target(locale, id, "invalid"));
  const updated = await updateCurrentUserAuction(id, { title, description, location, startingPriceMinor, minimumIncrementMinor, endsAt: endsAt.toISOString() });
  revalidatePath(`/${safeLocale(locale)}/auctions/${id}`);
  revalidatePath(`/${safeLocale(locale)}/my-auctions`);
  revalidatePath(`/${safeLocale(locale)}/my-auctions/${id}`);
  redirect(target(locale, id, updated ? "saved" : "unavailable"));
}

export async function addAuctionPhotosAction(locale: string, id: string, data: FormData) {
  const auction = await getCurrentUserAuction(id, locale);
  if (!auction || auction.cancelledAt || auction.bidCount > 0 || new Date(auction.endsAt).getTime() <= Date.now()) redirect(target(locale, id, "unavailable"));
  const files = data.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
  if (!files.length || auction.photoPaths.length + files.length > MAX_AUCTION_PHOTOS || validateAuctionPhotos(files)) redirect(target(locale, id, "photoInvalid"));
  if (!await uploadAuctionPhotos(auction, files)) redirect(target(locale, id, "unavailable"));
  revalidatePath(`/${safeLocale(locale)}/auctions/${id}`);
  revalidatePath(`/${safeLocale(locale)}/my-auctions/${id}`);
  redirect(target(locale, id, "photosSaved"));
}

export async function removeAuctionPhotoAction(locale: string, id: string, data: FormData) {
  const auction = await getCurrentUserAuction(id, locale);
  const path = text(data, "path");
  if (!auction || auction.cancelledAt || auction.bidCount > 0 || !auction.photoPaths.includes(path)) redirect(target(locale, id, "unavailable"));
  let removed: boolean;
  try {
    removed = await removeAuctionPhoto(auction, path);
  } catch (error) {
    console.error("Auction photo removal failed", error);
    revalidatePath(`/${safeLocale(locale)}/auctions/${id}`);
    redirect(target(locale, id, "photoCleanupFailed"));
  }
  if (!removed) redirect(target(locale, id, "unavailable"));
  revalidatePath(`/${safeLocale(locale)}/auctions/${id}`);
  revalidatePath(`/${safeLocale(locale)}/my-auctions/${id}`);
  redirect(target(locale, id, "photosSaved"));
}

export async function deleteAuctionAction(locale: string, id: string, data: FormData) {
  if (text(data, "confirmation") !== "delete") redirect(target(locale, id, "invalid"));
  const auction = await getCurrentUserAuction(id, locale);
  if (!auction || auction.cancelledAt || auction.bidCount > 0) redirect(target(locale, id, "unavailable"));
  if (!auction.supportsCancellation) await removeAuctionPhotoObjects(auction);
  const deleted = await deleteCurrentUserAuction(id);
  if (!deleted) redirect(target(locale, id, "unavailable"));
  let status = "deleted";
  try {
    if (auction.supportsCancellation) await removeAuctionPhotoObjects(auction);
  } catch (error) {
    console.error("Deleted auction photo cleanup failed", error);
    status = "deletedPhotoCleanupFailed";
  }
  revalidatePath(`/${safeLocale(locale)}/auctions/${id}`);
  revalidatePath(`/${safeLocale(locale)}/my-auctions`);
  redirect(`/${safeLocale(locale)}/my-auctions?status=${status}`);
}

export async function addAuctionNoteAction(locale: string, id: string, data: FormData) {
  const body = text(data, "body");
  if (body.length < 1 || body.length > 2000) redirect(target(locale, id, "invalid"));
  const added = await addCurrentUserAuctionNote(id, body);
  revalidatePath(`/${safeLocale(locale)}/auctions/${id}`);
  revalidatePath(`/${safeLocale(locale)}/my-auctions/${id}`);
  redirect(target(locale, id, added ? "noteAdded" : "unavailable"));
}

export async function completeAuctionSaleAction(locale: string, id: string) {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) throw new Error("Authentication is required.");
  const result = await completeAuctionSale(id);
  const safe = safeLocale(locale);
  revalidatePath(`/${safe}/my-auctions`);
  revalidatePath(`/${safe}/my-auctions/${id}`);
  revalidatePath(`/${safe}/my-bids`);
  redirect(target(locale, id, result === "sale_completed" ? "saleCompleted" : "unavailable"));
}

export async function continueWithNextAuctionCandidateAction(locale: string, id: string) {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) throw new Error("Authentication is required.");
  const result = await continueWithNextAuctionCandidate(id);
  const safe = safeLocale(locale);
  revalidatePath(`/${safe}/my-auctions`);
  revalidatePath(`/${safe}/my-auctions/${id}`);
  revalidatePath(`/${safe}/my-bids`);
  redirect(target(locale, id, result === "continued" ? "continued" : "unavailable"));
}

export async function cancelAuctionAction(
  id: string,
  _previousState: CancelAuctionState,
  data: FormData,
): Promise<CancelAuctionState> {
  const { userId } = await auth();
  if (!userId || !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)) {
    return { status: "unavailable" };
  }
  const reason = text(data, "reason");
  if (!reason || Array.from(reason).length > cancellationReasonLimit) {
    return { status: "invalidReason" };
  }

  let status: string;
  try {
    status = await cancelCurrentUserAuction(id, reason);
  } catch {
    return { status: "failed" };
  }
  if (status === "invalid_reason") return { status: "invalidReason" };

  for (const locale of ["sk", "en"]) {
    revalidatePath(`/${locale}/auctions/${id}`);
    revalidatePath(`/${locale}/my-auctions/${id}`);
    revalidatePath(`/${locale}/my-auctions`);
    revalidatePath(`/${locale}/my-bids`);
  }
  return { status: status === "cancelled" || status === "already_cancelled" ? "cancelled" : "unavailable" };
}
