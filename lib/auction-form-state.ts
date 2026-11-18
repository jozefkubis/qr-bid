export type AuctionField = "description" | "endsAt" | "location" | "minimumIncrement" | "photos" | "startingPrice" | "title";

export type CreateAuctionState = {
  fieldErrors?: Partial<Record<AuctionField, string>>;
  formError?: string;
};

export const initialCreateAuctionState: CreateAuctionState = {};
