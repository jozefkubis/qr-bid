"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CreateAuctionState } from "@/lib/auction-form-state";
import { createAuction, deleteCurrentUserAuction } from "@/lib/supabase/auctions";
import { uploadAuctionPhotos, validateAuctionPhotos } from "@/lib/supabase/auction-photos";

const maxMinorAmount = BigInt(Number.MAX_SAFE_INTEGER);

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function moneyToMinor(value: string) {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.replace(",", ".").split(".");
  const minor = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  if (minor < BigInt(1) || minor > maxMinorAmount) return null;
  return Number(minor);
}

export async function createAuctionAction(
  locale: string,
  _previousState: CreateAuctionState,
  formData: FormData,
): Promise<CreateAuctionState> {
  const title = text(formData, "title");
  const description = text(formData, "description");
  const startingPriceMinor = moneyToMinor(text(formData, "startingPrice"));
  const minimumIncrementMinor = moneyToMinor(text(formData, "minimumIncrement"));
  const endsAtValue = text(formData, "endsAt");
  const endsAt = new Date(endsAtValue);
  const fieldErrors: CreateAuctionState["fieldErrors"] = {};
  const photos = formData.getAll("photos").filter((value): value is File => value instanceof File && value.size > 0);

  if (title.length < 3 || title.length > 120) fieldErrors.title = "title";
  if (description.length > 5000) fieldErrors.description = "description";
  if (startingPriceMinor === null) fieldErrors.startingPrice = "money";
  if (minimumIncrementMinor === null) fieldErrors.minimumIncrement = "money";
  if (!endsAtValue || Number.isNaN(endsAt.getTime()) || endsAt.getTime() <= Date.now()) {
    fieldErrors.endsAt = "future";
  }
  const photoError = validateAuctionPhotos(photos);
  if (photoError) fieldErrors.photos = photoError;

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    const auction = await createAuction({
      title,
      description,
      startingPriceMinor: startingPriceMinor!,
      minimumIncrementMinor: minimumIncrementMinor!,
      endsAt: endsAt.toISOString(),
    });
    try {
      await uploadAuctionPhotos(auction.id, photos);
    } catch (error) {
      await deleteCurrentUserAuction(auction.id).catch(() => false);
      throw error;
    }
  } catch {
    return { formError: "save" };
  }

  const safeLocale = locale === "sk" ? "sk" : "en";
  revalidatePath(`/${safeLocale}/my-auctions`);
  redirect(`/${safeLocale}/my-auctions`);
}
