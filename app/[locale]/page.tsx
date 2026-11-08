import { Eye, MapPin } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CreateAuctionLink } from "@/components/auth/create-auction-link";
import { FinalCta } from "@/components/landing/final-cta";
import { HowItWorks } from "@/components/landing/how-it-works";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const sampleAuction = {
  currentBid: 145,
  minimumIncrement: 5,
  suggestedBids: [150, 155, 170],
  bidCount: 14,
  currency: "EUR",
} as const;

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Landing");
  const sampleMoney = new Intl.NumberFormat(locale === "sk" ? "sk-SK" : "en-IE", {
    style: "currency",
    currency: sampleAuction.currency,
    maximumFractionDigits: 0,
  });

  return (
    <>
      <main className="w-full">
        <section aria-labelledby="hero-heading" className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:px-8 lg:py-20 xl:gap-16">
          <div className="min-w-0">
            <p className="inline-flex rounded-soft border border-border bg-surface-muted px-3 py-1.5 text-sm font-semibold text-tertiary">{t("eyebrow")}</p>
            <h1 id="hero-heading" className="mt-6 text-4xl leading-tight font-medium tracking-tight text-foreground sm:text-5xl lg:text-[2.5rem] xl:text-5xl">
              {t("heroLine1")}<br />
              {t("heroLine2")}<br />
              <span className="text-primary">{t("heroLine3")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{t("description")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <CreateAuctionLink className="inline-flex min-h-11 items-center justify-center rounded-soft border border-primary bg-primary px-5 py-2.5 font-semibold text-white transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" showArrow />
              <a href="#sample-auction" className="inline-flex min-h-11 items-center justify-center rounded-soft border border-primary bg-surface px-5 py-2.5 font-semibold text-primary transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                <Eye aria-hidden="true" className="mr-2 size-5" />
                {t("viewSample")}
              </a>
            </div>
            <p className="mt-7 max-w-xl border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">{t("publicNote")}</p>
          </div>

          <Card id="sample-auction" className="min-w-0 scroll-mt-8" role="region" aria-labelledby="sample-auction-title">
            <p className="inline-flex rounded-soft bg-surface-muted px-3 py-1.5 text-sm font-semibold text-tertiary">{t("sample.badge")}</p>
            <h2 id="sample-auction-title" className="mt-5 text-2xl leading-snug font-medium">{t("sample.title")}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin aria-hidden="true" className="size-4 shrink-0" />
              {t("sample.location")}
            </p>
            <dl className="mt-6 grid gap-5 rounded-soft bg-surface-muted p-4 min-[390px]:grid-cols-2">
              <div><dt className="text-sm text-muted-foreground">{t("sample.currentBid")}</dt><dd className="mt-1 text-3xl font-bold text-primary">{sampleMoney.format(sampleAuction.currentBid)}</dd></div>
              <div><dt className="text-sm text-muted-foreground">{t("sample.timeRemaining")}</dt><dd className="mt-1 text-2xl font-bold">{t("sample.timeRemainingValue")}</dd></div>
            </dl>
            <div className="mt-6">
              <p className="text-sm font-semibold">{t("sample.nextBids", { increment: sampleMoney.format(sampleAuction.minimumIncrement) })}</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {sampleAuction.suggestedBids.map((amount) => (
                  <span key={amount} className="flex flex-col items-center justify-center gap-x-1 rounded-soft border border-border bg-surface-muted px-2 py-3 text-center text-sm font-semibold text-primary-hover sm:flex-row sm:flex-wrap">
                    <span>+{sampleMoney.format(amount - sampleAuction.currentBid)}</span><span>({sampleMoney.format(amount)})</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <Input id="sample-bid" label={t("sample.yourBid")} value={sampleMoney.format(sampleAuction.suggestedBids[0])} readOnly helpText={t("sample.displayOnly")} />
              <Button disabled className="mt-4 w-full disabled:opacity-100">{t("sample.biddingAfterLaunch")}</Button>
            </div>
            <div className="mt-6 flex flex-wrap justify-between gap-x-4 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
              <p>{t("sample.unlisted")}</p><p>{t("sample.exampleBids", { count: sampleAuction.bidCount })}</p>
            </div>
          </Card>
        </section>
        <HowItWorks />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
