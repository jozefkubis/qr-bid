export type AuctionField = "description" | "endsAt" | "minimumIncrement" | "photos" | "startingPrice" | "title";

export type CreateAuctionState = {
  fieldErrors?: Partial<Record<AuctionField, string>>;
  formError?: string;
};

export const initialCreateAuctionState: CreateAuctionState = {};
