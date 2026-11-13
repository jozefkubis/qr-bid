"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addCurrentUserAuctionNote, deleteCurrentUserAuction, getCurrentUserAuction, updateCurrentUserAuction } from "@/lib/supabase/auctions";
import { MAX_AUCTION_PHOTOS, removeAllAuctionPhotoObjects, removeAuctionPhotos, uploadAuctionPhotos, validateAuctionPhotos } from "@/lib/supabase/auction-photos";

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
  const startingPriceMinor = moneyToMinor(text(data, "startingPrice"));
  const minimumIncrementMinor = moneyToMinor(text(data, "minimumIncrement"));
  const endsAt = new Date(text(data, "endsAt"));
  if (title.length < 3 || title.length > 120 || description.length > 5000 || startingPriceMinor === null || minimumIncrementMinor === null || Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= Date.now()) redirect(target(locale, id, "invalid"));
  const updated = await updateCurrentUserAuction(id, { title, description, startingPriceMinor, minimumIncrementMinor, endsAt: endsAt.toISOString() });
  revalidatePath(`/${safeLocale(locale)}/auctions/${id}`);
  revalidatePath(`/${safeLocale(locale)}/my-auctions/${id}`);
  redirect(target(locale, id, updated ? "saved" : "unavailable"));
}

export async function addAuctionPhotosAction(locale: string, id: string, data: FormData) {
  const auction = await getCurrentUserAuction(id);
  if (!auction || auction.bidCount > 0 || new Date(auction.endsAt).getTime() <= Date.now()) redirect(target(locale, id, "unavailable"));
  const files = data.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);
  if (!files.length || auction.photoPaths.length + files.length > MAX_AUCTION_PHOTOS || validateAuctionPhotos(files)) redirect(target(locale, id, "photoInvalid"));
  await uploadAuctionPhotos(id, files);
  revalidatePath(`/${safeLocale(locale)}/auctions/${id}`);
  revalidatePath(`/${safeLocale(locale)}/my-auctions/${id}`);
  redirect(target(locale, id, "photosSaved"));
}

export async function removeAuctionPhotoAction(locale: string, id: string, data: FormData) {
  const auction = await getCurrentUserAuction(id);
  const path = text(data, "path");
  if (!auction || auction.bidCount > 0 || !auction.photoPaths.includes(path)) redirect(target(locale, id, "unavailable"));
  await removeAuctionPhotos([path]);
  revalidatePath(`/${safeLocale(locale)}/auctions/${id}`);
  revalidatePath(`/${safeLocale(locale)}/my-auctions/${id}`);
  redirect(target(locale, id, "photosSaved"));
}

export async function deleteAuctionAction(locale: string, id: string, data: FormData) {
  if (text(data, "confirmation") !== "delete") redirect(target(locale, id, "invalid"));
  const auction = await getCurrentUserAuction(id);
  if (!auction || auction.bidCount > 0) redirect(target(locale, id, "unavailable"));
  await removeAllAuctionPhotoObjects(id);
  const deleted = await deleteCurrentUserAuction(id);
  if (!deleted) redirect(target(locale, id, "unavailable"));
  revalidatePath(`/${safeLocale(locale)}/my-auctions`);
  redirect(`/${safeLocale(locale)}/my-auctions?status=deleted`);
}

export async function addAuctionNoteAction(locale: string, id: string, data: FormData) {
  const body = text(data, "body");
  if (body.length < 1 || body.length > 2000) redirect(target(locale, id, "invalid"));
  const added = await addCurrentUserAuctionNote(id, body);
  revalidatePath(`/${safeLocale(locale)}/auctions/${id}`);
  revalidatePath(`/${safeLocale(locale)}/my-auctions/${id}`);
  redirect(target(locale, id, added ? "noteAdded" : "unavailable"));
}
