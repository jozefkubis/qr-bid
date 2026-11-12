"use client";

import { ArrowRight, ImageIcon, MapPin, QrCode } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import type { DemoAuction, DemoCoverVariant } from "@/data/demo-auctions";

type AuctionCardProps = {
  auction: DemoAuction;
  now: number;
};

const coverClasses: Record<DemoCoverVariant, string> = {
  forest: "bg-linear-to-br from-primary/25 via-surface-muted to-tertiary/15",
  sand: "bg-linear-to-br from-tertiary/20 via-background to-primary/10",
  sage: "bg-linear-to-br from-primary/15 via-surface-muted to-primary/30",
  stone: "bg-linear-to-br from-muted-foreground/15 via-surface-muted to-tertiary/15",
};

function countdownParts(
  endTime: number,
  now: number,
  formatUnit: (unit: "days" | "hours" | "minutes", count: number) => string,
) {
  const totalMinutes = Math.max(0, Math.ceil((endTime - now) / 60_000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return [formatUnit("days", days), formatUnit("hours", hours)].join(" ");
  if (hours > 0) return [formatUnit("hours", hours), formatUnit("minutes", minutes)].join(" ");
  return formatUnit("minutes", minutes);
}

export function AuctionCard({ auction, now }: AuctionCardProps) {
  const locale = useLocale();
  const t = useTranslations("MyAuctions.card");
  const endTime = new Date(auction.endAt).getTime();
  const isEnded = auction.status === "ended" || endTime <= now;
  const currencyFormatter = new Intl.NumberFormat(locale === "sk" ? "sk-SK" : "en-IE", {
    style: "currency",
    currency: auction.currency,
    minimumFractionDigits: 2,
  });
  const dateFormatter = new Intl.DateTimeFormat(locale === "sk" ? "sk-SK" : "en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeText = isEnded
    ? t("endedOn", { date: dateFormatter.format(endTime) })
    : t("remaining", {
        time: countdownParts(endTime, now, (unit, count) => t(`countdown.${unit}`, { count })),
      });
  const highestBid = auction.currentHighestBidMinor === undefined
    ? t("noBidsYet")
    : currencyFormatter.format(auction.currentHighestBidMinor / 100);
  const qrHelpId = `${auction.id}-qr-help`;
  const detailsHelpId = `${auction.id}-details-help`;

  return (
    <article>
      <Card className="flex h-full flex-col overflow-hidden p-0">
        <div className="relative h-48 overflow-hidden rounded-t-soft">
          <div
            role="img"
            aria-label={t("coverPlaceholder", { title: auction.title })}
            className={`absolute inset-0 flex items-center justify-center ${coverClasses[auction.coverVariant]}`}
          >
            <ImageIcon aria-hidden="true" className="size-10 text-muted-foreground/70" />
          </div>
          <span className={`absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-semibold ${isEnded ? "bg-surface-muted text-muted-foreground" : "bg-primary text-white"}`}>
            {isEnded ? t("ended") : t("active")}
          </span>
          <span className="absolute top-4 right-4 rounded-full border border-border bg-surface/95 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
            {timeText}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div>
            <h2 className="line-clamp-2 text-lg font-semibold sm:text-xl">{auction.title}</h2>
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{auction.location}</span>
            </p>
          </div>

          <dl className="mt-5 grid grid-cols-3 divide-x divide-border border-y border-border py-4 text-center">
            <div className="min-w-0 px-2 first:pl-0">
              <dt className="text-[0.6875rem] leading-tight text-muted-foreground sm:text-xs">{t("currentHighest")}</dt>
              <dd className="mt-2 break-words font-semibold">{highestBid}</dd>
            </div>
            <div className="min-w-0 px-2">
              <dt className="text-[0.6875rem] leading-tight text-muted-foreground sm:text-xs">{t("totalBids")}</dt>
              <dd className="mt-2 font-semibold">{auction.bidCount}</dd>
            </div>
            <div className="min-w-0 px-2 last:pr-0">
              <dt className="text-[0.6875rem] leading-tight text-muted-foreground sm:text-xs">{t("startingPrice")}</dt>
              <dd className="mt-2 break-words font-semibold">{currencyFormatter.format(auction.startingPriceMinor / 100)}</dd>
            </div>
          </dl>

          <div className="mt-auto grid gap-4 pt-5 sm:grid-cols-2">
            <div className="grid content-start gap-2">
              <button
                type="button"
                disabled
                aria-describedby={qrHelpId}
                className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-soft border border-primary bg-surface px-4 py-2 text-sm font-semibold text-primary opacity-60"
              >
                <QrCode aria-hidden="true" className="size-4" />
                {t("viewShareQr")}
              </button>
              <p id={qrHelpId} className="text-xs text-muted-foreground">{t("qrComingSoon")}</p>
            </div>
            <div className="grid content-start gap-2">
              <button
                type="button"
                disabled
                aria-describedby={detailsHelpId}
                className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 rounded-soft border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white opacity-60"
              >
                {t("auctionDetails")}
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
              <p id={detailsHelpId} className="text-xs text-muted-foreground">{t("detailsComingSoon")}</p>
            </div>
          </div>
        </div>
      </Card>
    </article>
  );
}
