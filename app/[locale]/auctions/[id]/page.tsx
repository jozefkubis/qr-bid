import { auth, currentUser } from "@clerk/nextjs/server";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AuctionDetail } from "@/components/auctions/auction-detail";
import { AuctionRealtimeRefresh } from "@/components/auctions/auction-realtime-refresh";
import { RealAuctionDetail } from "@/components/auctions/real-auction-detail";
import { routing } from "@/i18n/routing";
import {
  currentUserOwnsAuction,
  getCurrentUserAuctionBidderNumber,
  getPublicAuction,
} from "@/lib/supabase/auctions";
import { placeBidAction } from "@/app/[locale]/auctions/[id]/actions";

export const instant = false;

export default async function PublicAuctionPage({ params }: PageProps<"/[locale]/auctions/[id]">) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  if (id.startsWith("demo-")) return <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8"><AuctionDetail id={id} /></main>;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) notFound();
  const auction = await getPublicAuction(id);
  if (!auction) notFound();
  const { userId } = await auth();
  const [isOwner, ownBidderNumber] = userId ? await Promise.all([
    currentUserOwnsAuction(id, locale),
    auction.bidHistory.some((bid) => bid.bidderNumber !== null)
      ? getCurrentUserAuctionBidderNumber(id)
      : null,
  ]) : [false, null] as const;
  const user = ownBidderNumber !== null ? await currentUser() : null;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <AuctionRealtimeRefresh auctionId={id}>
        <RealAuctionDetail
          auction={auction}
          avatarUrl={user?.hasImage ? user.imageUrl : null}
          bidAction={placeBidAction.bind(null, locale, id)}
          isOwner={isOwner}
          locale={locale}
          ownBidderNumber={ownBidderNumber}
          signedIn={Boolean(userId)}
        />
      </AuctionRealtimeRefresh>
    </main>
  );
}
