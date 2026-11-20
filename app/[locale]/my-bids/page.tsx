import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MyBidsDashboard } from "@/components/auctions/my-bids-dashboard";
import { AuctionResultOffers } from "@/components/auctions/auction-result-offers";
import { SiteFooter } from "@/components/layout/site-footer";
import { currentTimestamp } from "@/lib/server-time";
import { listCurrentUserBidAuctions } from "@/lib/supabase/auctions";
import { listCurrentUserAuctionResultOffers } from "@/lib/supabase/auction-results";

export const instant = false;

type MyBidsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ result?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: MyBidsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MyBids" });
  return { title: `${t("pageTitle")} — QRBid` };
}

export default async function MyBidsPage({
  params,
  searchParams,
}: MyBidsPageProps) {
  const { locale } = await params;
  const { result } = await searchParams;
  setRequestLocale(locale);

  const returnPath = `/${locale}/my-bids`;
  await auth.protect({
    unauthenticatedUrl: `/${locale}/sign-in?redirect_url=${encodeURIComponent(returnPath)}`,
  });
  const [auctions, resultOffers] = await Promise.all([
    listCurrentUserBidAuctions(locale),
    listCurrentUserAuctionResultOffers(locale),
  ]);

  return (
    <>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <AuctionResultOffers
          actionResult={typeof result === "string" ? result : null}
          offers={resultOffers}
        />
        <MyBidsDashboard auctions={auctions} now={currentTimestamp()} />
      </main>
      <SiteFooter />
    </>
  );
}
