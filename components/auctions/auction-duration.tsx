"use client";

import { CalendarCheck, Clock, LockKeyhole } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function localDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function AuctionDuration() {
  const locale = useLocale();
  const t = useTranslations("AuctionDuration");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [zone, setZone] = useState("");
  const [duration, setDuration] = useState<number | null>(72);

  function chooseDuration(hours: number) {
    const end = new Date(Date.now() + hours * 60 * 60 * 1000);
    setDate(localDateValue(end));
    setTime(`${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`);
    setDuration(hours);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      chooseDuration(72);
      setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const end = date && time ? new Date(`${date}T${time}`) : null;
  const summary = end && !Number.isNaN(end.getTime())
    ? t("summary", {
        date: new Intl.DateTimeFormat(locale === "sk" ? "sk-SK" : "en-IE", { weekday: "long", year: "numeric", month: "short", day: "numeric" }).format(end),
        time,
        zone,
      })
    : t("chooseSchedule");

  const durationOptions = [
    { hours: 24, label: t("hours24") },
    { hours: 72, label: t("days3") },
    { hours: 168, label: t("days7") },
  ];

  return (
    <fieldset className="min-w-0 border-t border-border pt-8">
      <legend className="sr-only">{t("title")}</legend>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="flex min-w-0 items-center gap-2 break-all text-sm text-tertiary"><Clock aria-hidden="true" className="size-4 shrink-0" />{zone || t("localTimeZone")}</p>
      </div>
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label={t("quickDuration")}>
        {durationOptions.map(({ hours, label }) => <Button key={hours} variant={duration === hours ? "primary" : "secondary"} aria-pressed={duration === hours} onClick={() => chooseDuration(hours)} className="px-4 text-sm">{label}</Button>)}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input id="end-date" label={t("endDate")} type="date" value={date} className="min-w-0" onChange={(event) => { setDate(event.target.value); setDuration(null); }} />
        <Input id="end-time" label={t("endTime")} type="time" value={time} className="min-w-0" onChange={(event) => { setTime(event.target.value); setDuration(null); }} />
      </div>
      <p role="status" className="mt-4 flex items-start gap-3 rounded-soft border border-border bg-surface-muted p-4 text-sm"><CalendarCheck aria-hidden="true" className="size-5 shrink-0 text-primary" />{summary}</p>
      <Card className="mt-8 flex items-start gap-4 bg-background shadow-none">
        <LockKeyhole aria-hidden="true" className="size-8 shrink-0 rounded-soft bg-surface-muted p-1.5 text-primary" />
        <div><h3 className="text-lg font-semibold">{t("unlistedTitle")}</h3><p className="mt-2 text-sm text-muted-foreground">{t("unlistedDescription")}</p></div>
      </Card>
    </fieldset>
  );
}
