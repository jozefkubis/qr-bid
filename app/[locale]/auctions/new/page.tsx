import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CreateAuctionForm } from "@/components/auctions/create-auction-form";
import { SiteFooter } from "@/components/layout/site-footer";

export const instant = false;

export async function generateMetadata({ params }: PageProps<"/[locale]/auctions/new">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AuctionForm" });
  return { title: `${t("pageTitle")} — QRBid` };
}

export default async function CreateAuctionPage({ params }: PageProps<"/[locale]/auctions/new">) {
  const { locale } = await params;
  setRequestLocale(locale);
  await auth.protect({ unauthenticatedUrl: `/${locale}/sign-in` });
  const t = await getTranslations("AuctionForm");

  return (
    <>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-semibold sm:text-4xl">{t("pageTitle")}</h1>
        <p className="mt-3 mb-8 text-muted-foreground">{t("pageDescription")}</p>
        <p id="auction-preview" className="mb-5 text-sm text-tertiary">{t("previewNote")}</p>
        <CreateAuctionForm />
      </main>
      <SiteFooter />
    </>
  );
}
