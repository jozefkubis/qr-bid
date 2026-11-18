import { auth } from "@clerk/nextjs/server";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AuctionSharing } from "@/components/auctions/auction-sharing";
import { routing } from "@/i18n/routing";
import { getAuctionPhotoUrl } from "@/lib/supabase/public-storage";
import { getCurrentUserAuction } from "@/lib/supabase/auctions";

export const instant = false;

const auctionIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function ShareAuctionPage({
  params,
  searchParams,
}: PageProps<"/[locale]/my-auctions/[id]/share">) {
  const { locale, id } = await params;
  const { published } = await searchParams;

  if (!hasLocale(routing.locales, locale) || !auctionIdPattern.test(id)) notFound();
  setRequestLocale(locale);

  const returnUrl = `/${locale}/my-auctions/${id}/share`;
  await auth.protect({
    unauthenticatedUrl: `/${locale}/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`,
  });

  const auction = await getCurrentUserAuction(id);
  if (!auction) notFound();
  const photoUrl = auction.photoPaths[0]
    ? getAuctionPhotoUrl(auction.photoPaths[0])
    : null;

  return (
    <AuctionSharing
      auctionId={auction.id}
      currency={auction.currency}
      endsAt={auction.endsAt}
      locale={locale}
      location={auction.location}
      photoUrl={photoUrl}
      published={published === "1"}
      startingPriceMinor={auction.startingPriceMinor}
      title={auction.title}
    />
  );
}
