"use client";

import { Check, Clock3, Mail, UserRound, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { respondToAuctionResultOfferAction } from "@/app/[locale]/my-bids/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MyAuctionResultOffer } from "@/lib/supabase/auction-results";

type AuctionResultOffersProps = {
  actionResult: string | null;
  offers: MyAuctionResultOffer[];
};

export function AuctionResultOffers({ actionResult, offers }: AuctionResultOffersProps) {
  const locale = useLocale();
  const t = useTranslations("MyBids.finalization");
  const numberLocale = locale === "sk" ? "sk-SK" : "en-IE";
  const date = new Intl.DateTimeFormat(numberLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const currency = new Intl.NumberFormat(numberLocale, {
    style: "currency",
    currency: "EUR",
  });
  const allowedResults = ["accepted", "declined", "expired", "invalid", "unavailable"];
  const visibleResult = actionResult && allowedResults.includes(actionResult) ? actionResult : null;

  if (!offers.length) return null;

  return (
    <section aria-labelledby="auction-results-title" className="mb-10">
      <div>
        <p className="text-sm font-semibold text-tertiary">{t("eyebrow")}</p>
        <h2 id="auction-results-title" className="mt-1 text-2xl font-semibold sm:text-3xl">
          {t("title")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground sm:text-base">
          {t("description")}
        </p>
      </div>

      {visibleResult ? (
        <p role="status" className="mt-5 rounded-soft border border-primary/20 bg-primary/10 p-4 text-sm font-semibold text-primary">
          {t(`actionStatus.${visibleResult}`)}
        </p>
      ) : null}

      <div className="mt-6 grid gap-5">
        {offers.map((offer) => {
          const active = offer.status === "active";
          return (
            <Card key={offer.offerId} className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <span className="inline-flex rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {t(`status.${offer.status}`)}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold">{offer.title}</h3>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">{t("amount")}</dt>
                      <dd className="mt-1 text-lg font-semibold text-primary">
                        {currency.format(offer.amountMinor / 100)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{t("deadline")}</dt>
                      <dd className="mt-1 flex items-start gap-2 text-sm font-semibold">
                        <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-tertiary" />
                        {date.format(new Date(offer.expiresAt))}
                      </dd>
                    </div>
                  </dl>
                </div>

                {active ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:w-[23rem]">
                    <form action={respondToAuctionResultOfferAction.bind(null, locale, offer.offerId, "accept")}>
                      <Button type="submit" className="w-full">
                        <Check aria-hidden="true" className="size-4" />
                        {t("accept")}
                      </Button>
                    </form>
                    <form action={respondToAuctionResultOfferAction.bind(null, locale, offer.offerId, "decline")}>
                      <Button type="submit" variant="secondary" className="w-full">
                        <X aria-hidden="true" className="size-4" />
                        {t("decline")}
                      </Button>
                    </form>
                    <p className="sm:col-span-2 text-xs text-muted-foreground">{t("consent")}</p>
                  </div>
                ) : null}
              </div>

              {offer.ownerContact ? (
                <div className="mt-5 rounded-soft border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-semibold text-primary">{t("ownerContact")}</p>
                  <p className="mt-3 flex items-center gap-2 text-sm">
                    <UserRound aria-hidden="true" className="size-4 text-tertiary" />
                    {offer.ownerContact.displayName}
                  </p>
                  <a className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline" href={`mailto:${offer.ownerContact.emailAddress}`}>
                    <Mail aria-hidden="true" className="size-4" />
                    {offer.ownerContact.emailAddress}
                  </a>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
