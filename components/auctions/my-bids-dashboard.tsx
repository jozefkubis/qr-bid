"use client";

import { ArrowRight, Clock3, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { MyBidAuction, MyBidAuctionStatus } from "@/lib/supabase/auctions";
import { getAuctionPhotoUrl } from "@/lib/supabase/public-storage";

type BidFilter = "all" | MyBidAuctionStatus;

function countdownParts(endTime: number, now: number) {
  const totalMinutes = Math.max(0, Math.ceil((endTime - now) / 60_000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes };
}

function MyBidCard({ auction, now }: { auction: MyBidAuction; now: number }) {
  const locale = useLocale();
  const t = useTranslations("MyBids.card");
  const currency = new Intl.NumberFormat(locale === "sk" ? "sk-SK" : "en-IE", {
    style: "currency",
    currency: auction.currency,
  });
  const date = new Intl.DateTimeFormat(locale === "sk" ? "sk-SK" : "en-IE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const endTime = new Date(auction.endsAt).getTime();
  const remaining = countdownParts(endTime, now);
  const timeText = auction.status === "ended"
    ? t("endedAt", { date: date.format(endTime) })
    : t("remaining", remaining);
  const coverUrl = auction.photoPath ? getAuctionPhotoUrl(auction.photoPath) : null;
  const statusClasses: Record<MyBidAuctionStatus, string> = {
    leading: "border-primary/25 bg-primary/10 text-primary",
    outbid: "border-tertiary/25 bg-tertiary/10 text-tertiary",
    ended: "border-border bg-surface-muted text-muted-foreground",
  };

  return (
    <article>
      <Card className="overflow-hidden !p-0">
        <div className="grid md:grid-cols-[10rem_minmax(0,1fr)] lg:grid-cols-[11rem_minmax(0,1fr)]">
          <div className="relative flex h-40 items-center justify-center overflow-hidden bg-linear-to-br from-primary/20 via-surface-muted to-tertiary/10 md:h-full md:min-h-48">
            {coverUrl ? (
              <Image
                unoptimized
                src={coverUrl}
                alt={t("coverPhoto", { title: auction.title })}
                fill
                sizes="(min-width: 1024px) 176px, (min-width: 768px) 160px, 100vw"
                className="object-cover"
              />
            ) : (
              <ImageIcon aria-hidden="true" className="size-10 text-muted-foreground/70" />
            )}
          </div>

          <div className="min-w-0 p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="min-w-0 flex-1 text-lg font-semibold sm:text-xl">{auction.title}</h2>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses[auction.status]}`}>
                {t(`status.${auction.status}`)}
              </span>
            </div>

            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{timeText}</span>
            </p>

            <div className="mt-5 grid gap-5 border-t border-border pt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <dl className="grid grid-cols-2 divide-x divide-border">
                <div className="min-w-0 pr-4">
                  <dt className="text-xs text-muted-foreground">
                    {auction.status === "ended" ? t("finalHighest") : t("currentHighest")}
                  </dt>
                  <dd className="mt-1 break-words font-semibold">
                    {currency.format(auction.currentHighestMinor / 100)}
                  </dd>
                </div>
                <div className="min-w-0 pl-4">
                  <dt className="text-xs text-muted-foreground">{t("myLatest")}</dt>
                  <dd className="mt-1 break-words font-semibold text-primary">
                    {currency.format(auction.myLatestAmountMinor / 100)}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/auctions/${auction.id}`}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-soft border border-primary bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:w-auto"
              >
                {t("viewAuction")}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </article>
  );
}

export function MyBidsDashboard({ auctions, now }: { auctions: MyBidAuction[]; now: number }) {
  const t = useTranslations("MyBids");
  const [filter, setFilter] = useState<BidFilter>("all");
  const counts = {
    all: auctions.length,
    leading: auctions.filter((auction) => auction.status === "leading").length,
    outbid: auctions.filter((auction) => auction.status === "outbid").length,
    ended: auctions.filter((auction) => auction.status === "ended").length,
  };
  const filteredAuctions = filter === "all"
    ? auctions
    : auctions.filter((auction) => auction.status === filter);
  const filters: BidFilter[] = ["all", "leading", "outbid", "ended"];

  return (
    <>
      <section aria-labelledby="my-bids-title">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 id="my-bids-title" className="text-3xl font-semibold sm:text-4xl">{t("pageTitle")}</h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">{t("pageDescription")}</p>
          </div>
          <div
            role="group"
            aria-label={t("filterLabel")}
            className="flex w-full gap-1 overflow-x-auto rounded-soft border border-border bg-surface p-1 shadow-soft lg:w-auto"
          >
            {filters.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={filter === option}
                aria-controls="my-bids-list"
                onClick={() => setFilter(option)}
                className={`min-h-11 shrink-0 cursor-pointer rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:px-4 sm:text-sm ${filter === option ? "bg-primary text-white" : "text-muted-foreground hover:bg-surface-muted hover:text-primary"}`}
              >
                {t(`filters.${option}`, { count: counts[option] })}
              </button>
            ))}
          </div>
        </div>
        <p role="status" className="sr-only">{t("results", { count: filteredAuctions.length })}</p>
      </section>

      <section id="my-bids-list" aria-label={t("listLabel")} className="mt-8 grid gap-5">
        {filteredAuctions.map((auction) => (
          <MyBidCard key={auction.id} auction={auction} now={now} />
        ))}
        {filteredAuctions.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {auctions.length === 0 ? t("emptyState") : t("filterEmpty")}
          </Card>
        ) : null}
      </section>
    </>
  );
}
