export const cancellationReasonLimit = 500;

export type CancelAuctionState = {
  status?: "cancelled" | "invalidReason" | "unavailable" | "failed";
};

export function getAuctionStatus(
  auction: { cancelledAt: string | null; startsAt: string; endsAt: string },
  now: number,
) {
  if (auction.cancelledAt) return "cancelled";
  if (Date.parse(auction.endsAt) <= now) return "ended";
  return Date.parse(auction.startsAt) > now ? "scheduled" : "active";
}
