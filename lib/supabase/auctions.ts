import "server-only";

import { auth } from "@clerk/nextjs/server";
import { ensureCurrentProfile } from "@/lib/supabase/profiles";
import { createPublicSupabaseServerClient, createSupabaseServerClient } from "@/lib/supabase/server";

export type OwnedAuction = {
  bidCount: number;
  createdAt: string;
  currency: "EUR";
  description: string;
  endsAt: string;
  id: string;
  location: string | null;
  minimumIncrementMinor: number;
  currentHighestMinor: number | null;
  startingPriceMinor: number;
  startsAt: string;
  title: string;
  photoPaths: string[];
};

export type PublicBid = { amountMinor: number; createdAt: string };
export type PublicOwnerNote = { body: string; createdAt: string };
export type MyBidAuctionStatus = "ended" | "leading" | "outbid";
export type MyBidAuction = {
  currency: "EUR";
  currentHighestMinor: number;
  endsAt: string;
  id: string;
  location: string | null;
  myLatestAmountMinor: number;
  myLatestBidAt: string;
  photoPath: string | null;
  status: MyBidAuctionStatus;
  title: string;
};
export type PublicAuction = Omit<OwnedAuction, "createdAt"> & {
  bidHistory: PublicBid[];
  minimumNextBidMinor: number;
  ownerNotes: PublicOwnerNote[];
};

async function currentSupabaseClient() {
  const { getToken, userId } = await auth();
  if (!userId) throw new Error("An authenticated Clerk session is required.");
  const token = await getToken();
  if (!token) throw new Error("A Clerk session token is required.");
  return createSupabaseServerClient(token);
}

function toOwnedAuction(row: {
  created_at: string;
  currency: "EUR";
  description: string;
  ends_at: string;
  id: string;
  location: string | null;
  min_increment_minor: number;
  starting_price_minor: number;
  starts_at: string;
  title: string;
  auction_photos?: { sort_order: number; storage_path: string }[];
}, summary?: { bid_count: number; current_highest_minor: number | null }): OwnedAuction {
  return {
    createdAt: row.created_at,
    bidCount: summary?.bid_count ?? 0,
    currency: row.currency,
    description: row.description,
    endsAt: row.ends_at,
    id: row.id,
    location: row.location,
    minimumIncrementMinor: row.min_increment_minor,
    currentHighestMinor: summary?.current_highest_minor ?? null,
    startingPriceMinor: row.starting_price_minor,
    startsAt: row.starts_at,
    title: row.title,
    photoPaths: row.auction_photos?.toSorted((left, right) => left.sort_order - right.sort_order).map((photo) => photo.storage_path) ?? [],
  };
}

const auctionColumns = "id, title, description, location, currency, starting_price_minor, min_increment_minor, starts_at, ends_at, created_at, auction_photos(storage_path, sort_order)";

export async function createAuction(input: {
  description: string;
  endsAt: string;
  location: string;
  minimumIncrementMinor: number;
  preferredLocale: string;
  startingPriceMinor: number;
  title: string;
}) {
  const profile = await ensureCurrentProfile(input.preferredLocale);
  const supabase = await currentSupabaseClient();
  const result = await supabase
    .from("auctions")
    .insert({
      owner_id: profile.id,
      title: input.title,
      description: input.description,
      location: input.location,
      currency: "EUR",
      starting_price_minor: input.startingPriceMinor,
      min_increment_minor: input.minimumIncrementMinor,
      ends_at: input.endsAt,
    })
    .select(auctionColumns)
    .single();

  if (result.error) throw result.error;
  return toOwnedAuction(result.data);
}

export async function listCurrentUserAuctions(preferredLocale: string) {
  await ensureCurrentProfile(preferredLocale);
  const supabase = await currentSupabaseClient();
  const [result, summaries] = await Promise.all([
    supabase.from("auctions").select(auctionColumns).order("created_at", { ascending: false }),
    supabase.rpc("get_owned_bid_summaries"),
  ]);

  if (result.error) throw result.error;
  if (summaries.error) throw summaries.error;
  const summaryByAuction = new Map(summaries.data.map((summary) => [summary.auction_id, summary]));
  return result.data.map((row) => toOwnedAuction(row, summaryByAuction.get(row.id)));
}

export async function listCurrentUserBidAuctions(preferredLocale: string): Promise<MyBidAuction[]> {
  await ensureCurrentProfile(preferredLocale);
  const supabase = await currentSupabaseClient();
  const result = await supabase.rpc("get_my_bid_auctions");

  if (result.error) throw result.error;
  return result.data.map((row) => ({
    currency: row.currency as "EUR",
    currentHighestMinor: row.current_highest_minor,
    endsAt: row.ends_at,
    id: row.auction_id,
    location: row.location,
    myLatestAmountMinor: row.my_latest_amount_minor,
    myLatestBidAt: row.my_latest_bid_at,
    photoPath: row.photo_path,
    status: row.status as MyBidAuctionStatus,
    title: row.title,
  }));
}

export async function getCurrentUserAuction(id: string, preferredLocale: string) {
  await ensureCurrentProfile(preferredLocale);
  const supabase = await currentSupabaseClient();
  const [result, summaries] = await Promise.all([
    supabase.from("auctions").select(auctionColumns).eq("id", id).maybeSingle(),
    supabase.rpc("get_owned_bid_summaries"),
  ]);

  if (result.error) throw result.error;
  if (summaries.error) throw summaries.error;
  const summary = summaries.data.find((item) => item.auction_id === id);
  return result.data ? toOwnedAuction(result.data, summary) : null;
}

export async function currentUserOwnsAuction(
  id: string,
  preferredLocale: string,
) {
  await ensureCurrentProfile(preferredLocale);
  const supabase = await currentSupabaseClient();
  const result = await supabase
    .from("auctions")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (result.error) throw result.error;
  return result.data !== null;
}

export async function getPublicAuction(id: string): Promise<PublicAuction | null> {
  const supabase = createPublicSupabaseServerClient();
  const result = await supabase.rpc("get_public_auction", { p_auction_id: id }).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) return null;
  return {
    id: result.data.id,
    title: result.data.title,
    description: result.data.description,
    location: result.data.location,
    currency: result.data.currency as "EUR",
    bidCount: result.data.bid_count,
    bidHistory: result.data.bid_history.map((bid) => ({ amountMinor: bid.amount_minor, createdAt: bid.created_at })),
    currentHighestMinor: result.data.current_highest_minor,
    startingPriceMinor: result.data.starting_price_minor,
    minimumIncrementMinor: result.data.min_increment_minor,
    minimumNextBidMinor: result.data.minimum_next_bid_minor,
    ownerNotes: result.data.owner_notes.map((note) => ({ body: note.body, createdAt: note.created_at })),
    startsAt: result.data.starts_at,
    endsAt: result.data.ends_at,
    photoPaths: result.data.photo_paths,
  };
}

export type PlaceBidResult = {
  acceptedAmountMinor: number | null;
  acceptedAt: string | null;
  bidCount: number;
  bidId: string | null;
  currentHighestMinor: number | null;
  minimumNextBidMinor: number | null;
  status: string;
};

export async function placeBid(auctionId: string, amountMinor: number, requestId: string): Promise<PlaceBidResult> {
  const supabase = await currentSupabaseClient();
  const result = await supabase.rpc("place_bid", { p_auction_id: auctionId, p_amount_minor: amountMinor, p_request_id: requestId }).single();
  if (result.error) throw result.error;
  return {
    acceptedAmountMinor: result.data.accepted_amount_minor,
    acceptedAt: result.data.accepted_at,
    bidCount: result.data.bid_count,
    bidId: result.data.bid_id,
    currentHighestMinor: result.data.current_highest_minor,
    minimumNextBidMinor: result.data.minimum_next_bid_minor,
    status: result.data.status,
  };
}

export async function addCurrentUserAuctionNote(auctionId: string, body: string) {
  const supabase = await currentSupabaseClient();
  const result = await supabase.rpc("add_owned_auction_note", { p_auction_id: auctionId, p_body: body });
  if (result.error) throw result.error;
  return result.data;
}

export async function updateCurrentUserAuction(id: string, input: {
  description: string;
  endsAt: string;
  location: string;
  minimumIncrementMinor: number;
  startingPriceMinor: number;
  title: string;
}) {
  const supabase = await currentSupabaseClient();
  const result = await supabase.rpc("update_owned_active_auction", {
    p_auction_id: id,
    p_title: input.title,
    p_description: input.description,
    p_location: input.location,
    p_starting_price_minor: input.startingPriceMinor,
    p_min_increment_minor: input.minimumIncrementMinor,
    p_ends_at: input.endsAt,
  });
  if (result.error) throw result.error;
  return result.data;
}

export async function deleteCurrentUserAuction(id: string) {
  const supabase = await currentSupabaseClient();
  const result = await supabase.rpc("delete_owned_active_auction", { p_auction_id: id });
  if (result.error) throw result.error;
  return result.data;
}

export async function getCurrentSupabaseClient() {
  return currentSupabaseClient();
}
