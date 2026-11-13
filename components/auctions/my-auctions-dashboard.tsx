"use client";

import { CheckCircle2, QrCode, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { OwnedAuctionCard } from "@/components/auctions/owned-auction-card";
import { Card } from "@/components/ui/card";
import type { OwnedAuction } from "@/lib/supabase/auctions";

type AuctionFilter = "active" | "all" | "ended";

export function MyAuctionsDashboard({ auctions, now }: { auctions: OwnedAuction[]; now: number }) {
  const t = useTranslations("MyAuctions");
  const [filter, setFilter] = useState<AuctionFilter>("all");
  const isEnded = (auction: OwnedAuction) => new Date(auction.endsAt).getTime() <= now;
  const activeCount = auctions.filter((auction) => !isEnded(auction)).length;
  const endedCount = auctions.length - activeCount;
  const filteredAuctions = auctions.filter((auction) => filter === "all" || (filter === "ended") === isEnded(auction));
  const filterOptions: Array<{ value: AuctionFilter; label: string }> = [
    { value: "all", label: t("filters.all", { count: auctions.length }) },
    { value: "active", label: t("filters.active", { count: activeCount }) },
    { value: "ended", label: t("filters.ended", { count: endedCount }) },
  ];
  const summaryCards = [
    { label: t("summary.liveBiddingActivity.label"), value: t("summary.liveBiddingActivity.value", { count: activeCount }), meta: t("live.realData"), icon: Radio, iconClasses: "bg-tertiary/10 text-tertiary" },
    { label: t("summary.finishedBidding.label"), value: t("summary.finishedBidding.value", { count: endedCount }), meta: t("live.realData"), icon: CheckCircle2, iconClasses: "bg-surface-muted text-muted-foreground" },
    { label: t("summary.physicalScansToday.label"), value: "—", meta: t("summary.notAvailable"), icon: QrCode, iconClasses: "bg-primary/10 text-primary" },
  ];

  return (
    <>
      <section aria-labelledby="my-auctions-title">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{t("pageDescription")}</p>
          <div role="group" aria-label={t("live.filterLabel")} className="inline-flex w-fit rounded-soft border border-border bg-surface p-1 shadow-soft">
            {filterOptions.map((option) => (
              <button key={option.value} type="button" aria-pressed={filter === option.value} aria-controls="auction-list" onClick={() => setFilter(option.value)} className={`min-h-11 cursor-pointer rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:px-4 sm:text-sm ${filter === option.value ? "bg-primary text-white" : "text-muted-foreground hover:bg-surface-muted hover:text-primary"}`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <p role="status" className="sr-only">{t("live.results", { count: filteredAuctions.length })}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {summaryCards.map(({ label, value, meta, icon: Icon, iconClasses }) => (
            <Card key={label} role="group" className="flex items-center gap-4 p-5" aria-label={`${label}: ${value}. ${meta}`}>
              <span className={`inline-flex size-12 shrink-0 items-center justify-center rounded-full ${iconClasses}`}><Icon aria-hidden="true" className="size-5" /></span>
              <div className="min-w-0 flex-1"><h2 className="text-xs font-medium leading-tight">{label}</h2><p className="mt-1 font-heading text-base font-semibold sm:text-lg">{value}</p></div>
              <p className="shrink-0 text-xs font-semibold text-muted-foreground">{meta}</p>
            </Card>
          ))}
        </div>
      </section>
      <section id="auction-list" aria-label={t("live.listLabel")} className="mt-8 grid items-stretch gap-6 lg:grid-cols-2">
        {filteredAuctions.map((auction) => <OwnedAuctionCard key={auction.id} auction={auction} now={now} />)}
        {filteredAuctions.length === 0 ? <Card className="p-8 text-center text-muted-foreground lg:col-span-2">{auctions.length === 0 ? t("live.emptyState") : t("live.filterEmpty")}</Card> : null}
      </section>
    </>
  );
}
