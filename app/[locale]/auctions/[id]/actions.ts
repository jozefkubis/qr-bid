"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type { BidActionState } from "@/lib/bid-action-state";
import { placeBid } from "@/lib/supabase/auctions";
import { ensureCurrentProfile } from "@/lib/supabase/profiles";

const maxMinorAmount = BigInt(Number.MAX_SAFE_INTEGER);

export async function placeBidAction(
  locale: string,
  auctionId: string,
  _previousState: BidActionState,
  formData: FormData,
): Promise<BidActionState> {
  const { userId } = await auth();
  if (!userId) return { status: "signInRequired" };

  const amountValue = formData.get("amountMinor");
  const requestId = formData.get("requestId");
  if (typeof amountValue !== "string" || !/^\d+$/.test(amountValue) || typeof requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    return { status: "invalidRequest" };
  }

  const amountMinor = BigInt(amountValue);
  if (amountMinor < BigInt(1) || amountMinor > maxMinorAmount) return { status: "invalidAmount" };

  await ensureCurrentProfile();
  const result = await placeBid(auctionId, Number(amountMinor), requestId);
  revalidatePath(`/${locale === "sk" ? "sk" : "en"}/auctions/${auctionId}`);
  revalidatePath(`/${locale === "sk" ? "sk" : "en"}/my-auctions`);
  return { status: result.status, minimumNextBidMinor: result.minimumNextBidMinor ?? undefined };
}
