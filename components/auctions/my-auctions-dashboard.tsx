"use client";

import { CheckCircle2, QrCode, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { AuctionCard } from "@/components/auctions/auction-card";
import { Card } from "@/components/ui/card";
import { createDemoAuctions, type DemoAuctionStatus } from "@/data/demo-auctions";

type AuctionFilter = "all" | DemoAuctionStatus;

type DemoClock = {
  referenceTime: number;
  now: number;
};

export function MyAuctionsDashboard() {
  const t = useTranslations("MyAuctions");
  const [filter, setFilter] = useState<AuctionFilter>("all");
  const [clock, setClock] = useState<DemoClock | null>(null);
  const referenceTime = clock?.referenceTime ?? null;
  const auctions = useMemo(
    () => referenceTime === null ? [] : createDemoAuctions(referenceTime),
    [referenceTime],
  );

  useEffect(() => {
    let interval: number | undefined;
    const initialization = window.setTimeout(() => {
      const currentTime = Date.now();
      setClock({ referenceTime: currentTime, now: currentTime });
      interval = window.setInterval(() => {
        setClock((current) => current === null ? null : { ...current, now: Date.now() });
      }, 60_000);
    }, 0);

    return () => {
      window.clearTimeout(initialization);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, []);

  if (clock === null) {
    return (
      <div aria-hidden="true">
        <div className="h-11 w-full max-w-xl animate-pulse rounded-soft bg-surface-muted motion-reduce:animate-none" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-soft bg-surface-muted motion-reduce:animate-none" />
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-96 animate-pulse rounded-soft bg-surface-muted motion-reduce:animate-none" />
          ))}
        </div>
      </div>
    );
  }

  const activeCount = auctions.filter((auction) => auction.status === "active").length;
  const endedCount = auctions.filter((auction) => auction.status === "ended").length;
  const filteredAuctions = filter === "all"
    ? auctions
    : auctions.filter((auction) => auction.status === filter);
  const filterOptions: Array<{ value: AuctionFilter; label: string }> = [
    { value: "all", label: t("filters.all", { count: auctions.length }) },
    { value: "active", label: t("filters.active", { count: activeCount }) },
    { value: "ended", label: t("filters.ended", { count: endedCount }) },
  ];
  const summaryCards = [
    {
      label: t("summary.liveBiddingActivity.label"),
      value: t("summary.liveBiddingActivity.value", { count: activeCount }),
      meta: t("summary.demoData"),
      icon: Radio,
      iconClasses: "bg-tertiary/10 text-tertiary",
      metaClasses: "rounded-full border border-tertiary/20 bg-tertiary/10 px-3 py-1 text-tertiary",
    },
    {
      label: t("summary.finishedBidding.label"),
      value: t("summary.finishedBidding.value", { count: endedCount }),
      meta: t("summary.demoData"),
      icon: CheckCircle2,
      iconClasses: "bg-surface-muted text-muted-foreground",
      metaClasses: "rounded-full border border-border bg-surface-muted px-3 py-1 text-muted-foreground",
    },
    {
      label: t("summary.physicalScansToday.label"),
      value: "—",
      meta: t("summary.notAvailable"),
      icon: QrCode,
      iconClasses: "bg-primary/10 text-primary",
      metaClasses: "text-muted-foreground",
    },
  ];

  return (
    <>
      <section aria-labelledby="my-auctions-title">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm text-muted-foreground sm:text-base">{t("pageDescription")}</p>
            <p className="mt-2 text-xs font-semibold text-tertiary">{t("demoDisclosure")}</p>
          </div>

          <div role="group" aria-label={t("filters.label")} className="inline-flex w-fit rounded-soft border border-border bg-surface p-1 shadow-soft">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filter === option.value}
                aria-controls="demo-auction-list"
                onClick={() => setFilter(option.value)}
                className={`min-h-11 cursor-pointer rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:px-4 sm:text-sm ${filter === option.value ? "bg-primary text-white" : "text-muted-foreground hover:bg-surface-muted hover:text-primary"}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <p role="status" className="sr-only">{t("filters.results", { count: filteredAuctions.length })}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {summaryCards.map(({ label, value, meta, icon: Icon, iconClasses, metaClasses }) => (
            <Card key={label} role="group" className="flex items-center gap-4 p-5" aria-label={`${label}: ${value}. ${meta}`}>
              <span className={`inline-flex size-12 shrink-0 items-center justify-center rounded-full ${iconClasses}`}>
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[0.6875rem] font-medium leading-tight text-foreground sm:text-xs">{label}</h2>
                <p className="mt-1 font-heading text-base font-semibold leading-tight sm:text-lg">{value}</p>
              </div>
              <p className={`shrink-0 text-[0.6875rem] font-semibold ${metaClasses}`}>{meta}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="demo-auction-list" aria-label={t("card.listLabel")} className="mt-8 grid items-stretch gap-6 lg:grid-cols-2">
        {filteredAuctions.map((auction) => (
          <AuctionCard key={auction.id} auction={auction} now={clock.now} />
        ))}
      </section>
    </>
  );
}
