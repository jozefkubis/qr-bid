import "server-only";

import { auth } from "@clerk/nextjs/server";
import { getVerifiedClerkContact, type VerifiedClerkContact } from "@/lib/clerk-user";
import { ensureCurrentProfile } from "@/lib/supabase/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuctionResultOfferStatus = "active" | "accepted" | "declined" | "expired" | "withdrawn";
export type AuctionFinalizationStatus = "awaiting_response" | "interest_confirmed" | "sale_completed" | "no_bids" | "exhausted";

export type MyAuctionResultOffer = {
  acceptedAt: string | null;
  amountMinor: number;
  auctionId: string;
  currency: "EUR";
  expiresAt: string;
  finalizationStatus: AuctionFinalizationStatus;
  issuedAt: string;
  offerId: string;
  ownerContact: VerifiedClerkContact | null;
  status: AuctionResultOfferStatus;
  title: string;
};

export type OwnedAuctionFinalization = {
  auctionId: string;
  closedAt: string | null;
  confirmedAmountMinor: number | null;
  confirmedBidderContact: VerifiedClerkContact | null;
  confirmedOfferId: string | null;
  currency: "EUR";
  interestConfirmedAt: string | null;
  saleCompletedAt: string | null;
  startedAt: string;
  status: AuctionFinalizationStatus;
  title: string;
};

async function currentSupabaseClient() {
  const { getToken, userId } = await auth();
  if (!userId) throw new Error("An authenticated Clerk session is required.");
  const token = await getToken();
  if (!token) throw new Error("A Clerk session token is required.");
  return createSupabaseServerClient(token);
}

export async function listCurrentUserAuctionResultOffers(preferredLocale: string): Promise<MyAuctionResultOffer[]> {
  await ensureCurrentProfile(preferredLocale);
  const supabase = await currentSupabaseClient();
  const result = await supabase.rpc("get_my_auction_result_offers");
  if (result.error) throw result.error;

  const contactByClerkId = new Map<string, Promise<VerifiedClerkContact>>();
  const contactFor = (clerkUserId: string | null) => {
    if (!clerkUserId) return null;
    const existing = contactByClerkId.get(clerkUserId);
    if (existing) return existing;
    const contact = getVerifiedClerkContact(clerkUserId);
    contactByClerkId.set(clerkUserId, contact);
    return contact;
  };

  return Promise.all(result.data.map(async (row) => ({
    acceptedAt: row.accepted_at,
    amountMinor: row.amount_minor,
    auctionId: row.auction_id,
    currency: row.currency as "EUR",
    expiresAt: row.expires_at,
    finalizationStatus: row.finalization_status as AuctionFinalizationStatus,
    issuedAt: row.issued_at,
    offerId: row.offer_id,
    ownerContact: await contactFor(row.owner_clerk_user_id),
    status: row.offer_status as AuctionResultOfferStatus,
    title: row.title,
  })));
}

export async function getOwnedAuctionFinalization(
  auctionId: string,
  preferredLocale: string,
): Promise<OwnedAuctionFinalization | null> {
  await ensureCurrentProfile(preferredLocale);
  const supabase = await currentSupabaseClient();
  const result = await supabase
    .rpc("get_owned_auction_finalization", { p_auction_id: auctionId })
    .maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) return null;

  return {
    auctionId: result.data.auction_id,
    closedAt: result.data.closed_at,
    confirmedAmountMinor: result.data.confirmed_amount_minor,
    confirmedBidderContact: result.data.confirmed_bidder_clerk_user_id
      ? await getVerifiedClerkContact(result.data.confirmed_bidder_clerk_user_id)
      : null,
    confirmedOfferId: result.data.confirmed_offer_id,
    currency: result.data.currency as "EUR",
    interestConfirmedAt: result.data.interest_confirmed_at,
    saleCompletedAt: result.data.sale_completed_at,
    startedAt: result.data.started_at,
    status: result.data.finalization_status as AuctionFinalizationStatus,
    title: result.data.title,
  };
}

export async function respondToAuctionResultOffer(offerId: string, response: "accept" | "decline") {
  const supabase = await currentSupabaseClient();
  const result = await supabase.rpc("respond_to_auction_result_offer", {
    p_offer_id: offerId,
    p_response: response,
  });
  if (result.error) throw result.error;
  return result.data;
}

export async function continueWithNextAuctionCandidate(auctionId: string) {
  const supabase = await currentSupabaseClient();
  const result = await supabase.rpc("continue_with_next_auction_candidate", {
    p_auction_id: auctionId,
  });
  if (result.error) throw result.error;
  return result.data;
}

export async function completeAuctionSale(auctionId: string) {
  const supabase = await currentSupabaseClient();
  const result = await supabase.rpc("complete_auction_sale", {
    p_auction_id: auctionId,
  });
  if (result.error) throw result.error;
  return result.data;
}
