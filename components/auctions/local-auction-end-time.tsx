"use client";

import { useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";

const subscribe = () => () => undefined;

export function LocalAuctionEndTime({ ended, endsAt }: { ended: boolean; endsAt: string }) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const locale = useLocale();
  const t = useTranslations("AuctionDetail");
  const language = locale === "sk" ? "sk-SK" : "en-IE";
  const date = new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
    ...(hydrated ? { timeZoneName: "short" as const } : { timeZone: "UTC", timeZoneName: "short" as const }),
  }).format(new Date(endsAt));

  return <p className="mt-4 font-semibold text-primary">{ended ? t("endedOn", { date }) : t("liveEndsOn", { date })}</p>;
}
