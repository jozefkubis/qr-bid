export type DemoAuctionStatus = "active" | "ended";
export type DemoCoverVariant = "forest" | "sand" | "sage" | "stone";
export type DemoBid = { id: string; amountMinor: number; placedAt: string };
export type DemoAuctionNote = { id: string; text: string; publishedAt: string };

export type DemoAuction = {
  id: string;
  title: string;
  location: string;
  description: string;
  coverVariant: DemoCoverVariant;
  photoUrls: string[];
  currency: "EUR";
  startingPriceMinor: number;
  minimumIncrementMinor: number;
  startAt: string;
  endAt: string;
  status: DemoAuctionStatus;
  bids: DemoBid[];
  notes: DemoAuctionNote[];
};

type DemoAuctionDefinition = Omit<DemoAuction, "startAt" | "endAt" | "bids" | "notes"> & {
  startOffsetMinutes: number;
  endOffsetMinutes: number;
  bids: Array<Omit<DemoBid, "placedAt"> & { offsetMinutes: number }>;
  notes?: Array<Omit<DemoAuctionNote, "publishedAt"> & { offsetMinutes: number }>;
};

const minute = 60_000;
const makeBids = (prefix: string, count: number, first: number, step: number, spacing: number) =>
  Array.from({ length: count }, (_, index) => ({ id: `${prefix}-${index + 1}`, amountMinor: first + index * step, offsetMinutes: -((count - index) * spacing) }));

const demoAuctionDefinitions: DemoAuctionDefinition[] = [
  {
    id: "demo-covered-parking",
    title: "Covered parking space with gated access (Demo)",
    location: "Sample residential complex · Level -1",
    description: "A wide covered parking space in a modern residential garage. The entrance is protected by a remote-controlled gate and the space is close to the lift.",
    coverVariant: "forest",
    photoUrls: ["/demo-auctions/covered-parking-wide.png", "/demo-auctions/covered-parking-entrance.png"],
    currency: "EUR",
    startingPriceMinor: 8_000,
    minimumIncrementMinor: 500,
    startOffsetMinutes: -7 * 24 * 60,
    endOffsetMinutes: 3 * 60 + 42,
    status: "active",
    bids: [...makeBids("covered-bid", 13, 8_000, 800, 95), { id: "covered-bid-14", amountMinor: 18_500, offsetMinutes: -95 }],
    notes: [{ id: "covered-note-1", text: "A second remote control for the entrance gate is included.", offsetMinutes: -180 }],
  },
  {
    id: "demo-private-garage",
    title: "Private garage bay with remote gate (Demo)",
    location: "Illustrative riverside district · Indoor access",
    description: "An illustrative indoor garage bay with convenient street access and a remote-controlled entrance gate.",
    coverVariant: "sand",
    photoUrls: [],
    currency: "EUR",
    startingPriceMinor: 5_000,
    minimumIncrementMinor: 500,
    startOffsetMinutes: -5 * 24 * 60,
    endOffsetMinutes: 32 * 60,
    status: "active",
    bids: makeBids("garage-bid", 7, 6_000, 1_000, 210),
  },
  {
    id: "demo-storage-unit",
    title: "Secure storage unit near the lobby (Demo)",
    location: "Example apartment building · Ground floor",
    description: "A dry, lockable storage unit on the ground floor near the main lobby. Suitable for bicycles and seasonal equipment.",
    coverVariant: "sage",
    photoUrls: [],
    currency: "EUR",
    startingPriceMinor: 6_000,
    minimumIncrementMinor: 300,
    startOffsetMinutes: -2 * 24 * 60,
    endOffsetMinutes: 5 * 60 + 15,
    status: "active",
    bids: [],
  },
  {
    id: "demo-bicycle-space",
    title: "Sheltered bicycle parking space (Demo)",
    location: "Fictional community courtyard · Covered area",
    description: "A sheltered bicycle parking place in a fictional residential courtyard with easy access from the street.",
    coverVariant: "stone",
    photoUrls: [],
    currency: "EUR",
    startingPriceMinor: 4_500,
    minimumIncrementMinor: 500,
    startOffsetMinutes: -14 * 24 * 60,
    endOffsetMinutes: -24 * 60,
    status: "ended",
    bids: makeBids("bicycle-bid", 6, 7_000, 500, 360),
  },
];

export const demoAuctionIds = demoAuctionDefinitions.map(({ id }) => id);

export function createDemoAuctions(referenceTime: number): DemoAuction[] {
  return demoAuctionDefinitions.map(({ startOffsetMinutes, endOffsetMinutes, bids, notes = [], ...auction }) => ({
    ...auction,
    startAt: new Date(referenceTime + startOffsetMinutes * minute).toISOString(),
    endAt: new Date(referenceTime + endOffsetMinutes * minute).toISOString(),
    bids: bids.map(({ offsetMinutes, ...bid }) => ({ ...bid, placedAt: new Date(referenceTime + offsetMinutes * minute).toISOString() })),
    notes: notes.map(({ offsetMinutes, ...note }) => ({ ...note, publishedAt: new Date(referenceTime + offsetMinutes * minute).toISOString() })),
  }));
}

export function getEffectiveAuctionStatus(auction: DemoAuction, now: number): DemoAuctionStatus {
  return auction.status === "ended" || new Date(auction.endAt).getTime() <= now ? "ended" : "active";
}

export function getAuctionBidSummary(auction: DemoAuction) {
  const sortedBids = [...auction.bids].sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
  const highestBidMinor = auction.bids.reduce<number | undefined>((highest, bid) => highest === undefined || bid.amountMinor > highest ? bid.amountMinor : highest, undefined);
  return { bidCount: auction.bids.length, highestBidMinor, sortedBids };
}
