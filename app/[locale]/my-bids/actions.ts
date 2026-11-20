"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { respondToAuctionResultOffer } from "@/lib/supabase/auction-results";
import { ensureCurrentProfile } from "@/lib/supabase/profiles";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function respondToAuctionResultOfferAction(
  locale: string,
  offerId: string,
  response: "accept" | "decline",
) {
  const safeLocale = locale === "sk" ? "sk" : "en";
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) throw new Error("Authentication is required.");
  if (!uuidPattern.test(offerId) || !["accept", "decline"].includes(response)) {
    redirect(`/${safeLocale}/my-bids?result=invalid`);
  }

  await ensureCurrentProfile(safeLocale);
  const result = await respondToAuctionResultOffer(offerId, response);
  revalidatePath(`/${safeLocale}/my-bids`);
  revalidatePath(`/${safeLocale}/my-auctions`);
  redirect(`/${safeLocale}/my-bids?result=${encodeURIComponent(result)}`);
}
