export type DemoAuctionStatus = "active" | "ended";

export type DemoCoverVariant = "forest" | "sand" | "sage" | "stone";

export type DemoAuction = {
  id: string;
  title: string;
  location: string;
  coverVariant: DemoCoverVariant;
  currency: "EUR";
  startingPriceMinor: number;
  currentHighestBidMinor?: number;
  bidCount: number;
  startAt: string;
  endAt: string;
  status: DemoAuctionStatus;
};

type DemoAuctionDefinition = Omit<DemoAuction, "startAt" | "endAt"> & {
  startOffsetMinutes: number;
  endOffsetMinutes: number;
};

const minuteInMilliseconds = 60_000;

const demoAuctionDefinitions: DemoAuctionDefinition[] = [
  {
    id: "demo-covered-parking",
    title: "Covered parking space with gated access (Demo)",
    location: "Sample residential complex · Level -1",
    coverVariant: "forest",
    currency: "EUR",
    startingPriceMinor: 8_000,
    currentHighestBidMinor: 18_500,
    bidCount: 14,
    startOffsetMinutes: -7 * 24 * 60,
    endOffsetMinutes: 3 * 60 + 42,
    status: "active",
  },
  {
    id: "demo-private-garage",
    title: "Private garage bay with remote gate (Demo)",
    location: "Illustrative riverside district · Indoor access",
    coverVariant: "sand",
    currency: "EUR",
    startingPriceMinor: 5_000,
    currentHighestBidMinor: 12_000,
    bidCount: 7,
    startOffsetMinutes: -5 * 24 * 60,
    endOffsetMinutes: 32 * 60,
    status: "active",
  },
  {
    id: "demo-storage-unit",
    title: "Secure storage unit near the lobby (Demo)",
    location: "Example apartment building · Ground floor",
    coverVariant: "sage",
    currency: "EUR",
    startingPriceMinor: 6_000,
    bidCount: 0,
    startOffsetMinutes: -2 * 24 * 60,
    endOffsetMinutes: 5 * 60 + 15,
    status: "active",
  },
  {
    id: "demo-bicycle-space",
    title: "Sheltered bicycle parking space (Demo)",
    location: "Fictional community courtyard · Covered area",
    coverVariant: "stone",
    currency: "EUR",
    startingPriceMinor: 4_500,
    currentHighestBidMinor: 9_500,
    bidCount: 6,
    startOffsetMinutes: -14 * 24 * 60,
    endOffsetMinutes: -24 * 60,
    status: "ended",
  },
];

export function createDemoAuctions(referenceTime: number): DemoAuction[] {
  return demoAuctionDefinitions.map(({ startOffsetMinutes, endOffsetMinutes, ...auction }) => ({
    ...auction,
    startAt: new Date(referenceTime + startOffsetMinutes * minuteInMilliseconds).toISOString(),
    endAt: new Date(referenceTime + endOffsetMinutes * minuteInMilliseconds).toISOString(),
  }));
}
