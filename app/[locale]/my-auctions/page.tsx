import { auth } from "@clerk/nextjs/server";
import { QrCode } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MyAuctionsDashboard } from "@/components/auctions/my-auctions-dashboard";
import { SiteFooter } from "@/components/layout/site-footer";
import { Link } from "@/i18n/navigation";

export const instant = false;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/my-auctions">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MyAuctions" });
  return { title: `${t("pageTitle")} — QRBid` };
}

export default async function MyAuctionsPage({
  params,
}: PageProps<"/[locale]/my-auctions">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const returnPath = `/${locale}/my-auctions`;
  await auth.protect({
    unauthenticatedUrl: `/${locale}/sign-in?redirect_url=${encodeURIComponent(returnPath)}`,
  });

  const t = await getTranslations("MyAuctions");

  return (
    <>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <h1 id="my-auctions-title" className="sr-only">{t("pageTitle")}</h1>
        <MyAuctionsDashboard />

        <section className="mt-10 rounded-soft border border-border bg-surface p-6 shadow-soft sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-primary">
                <QrCode aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold sm:text-2xl">{t("cta.title")}</h2>
                <p className="mt-2 text-muted-foreground">{t("cta.description")}</p>
              </div>
            </div>
            <Link
              href="/auctions/new"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-soft border border-primary bg-primary px-5 py-2.5 font-semibold text-white transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              {t("cta.action")}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
