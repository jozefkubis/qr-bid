"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { getAuctionBidSummary, type DemoAuction } from "@/data/demo-auctions";

export function BidHistory({ auction }: { auction: DemoAuction }) {
  const locale = useLocale();
  const t = useTranslations("AuctionDetail.history");
  const { bidCount, highestBidMinor, sortedBids } = getAuctionBidSummary(auction);
  const language = locale === "sk" ? "sk-SK" : "en-IE";
  const money = new Intl.NumberFormat(language, { style: "currency", currency: auction.currency, minimumFractionDigits: 2 });
  const dateTime = new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" });

  return (
    <Card role="region" aria-labelledby={`${auction.id}-history-title`} className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 id={`${auction.id}-history-title`} className="text-xl font-semibold">{t("title")}</h2>
        <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold">{t("count", { count: bidCount })}</span>
      </div>
      {sortedBids.length === 0 ? <p className="mt-5 text-muted-foreground">{t("empty")}</p> : (
        <ol className="mt-5 divide-y divide-border">
          {sortedBids.map((bid) => (
            <li key={bid.id} className="flex min-w-0 items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="font-semibold">{money.format(bid.amountMinor / 100)}</p>
                <time className="text-xs text-muted-foreground" dateTime={bid.placedAt}>{dateTime.format(new Date(bid.placedAt))}</time>
              </div>
              {bid.amountMinor === highestBidMinor ? <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{t("highest")}</span> : null}
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
