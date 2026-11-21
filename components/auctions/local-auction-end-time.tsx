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
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: hydrated ? undefined : "UTC",
    timeZoneName: "short",
  }).format(new Date(endsAt));

  return <p className="mt-4 font-semibold text-primary">{ended ? t("endedOn", { date }) : t("liveEndsOn", { date })}</p>;
}
