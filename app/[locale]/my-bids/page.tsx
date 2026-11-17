import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MyBidsDashboard } from "@/components/auctions/my-bids-dashboard";
import { SiteFooter } from "@/components/layout/site-footer";
import { currentTimestamp } from "@/lib/server-time";
import { listCurrentUserBidAuctions } from "@/lib/supabase/auctions";

export const instant = false;

type MyBidsPageProps = {
  params: Promise<{ locale: string }>;
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
}: MyBidsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const returnPath = `/${locale}/my-bids`;
  await auth.protect({
    unauthenticatedUrl: `/${locale}/sign-in?redirect_url=${encodeURIComponent(returnPath)}`,
  });
  const auctions = await listCurrentUserBidAuctions();

  return (
    <>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <MyBidsDashboard auctions={auctions} now={currentTimestamp()} />
      </main>
      <SiteFooter />
    </>
  );
}
