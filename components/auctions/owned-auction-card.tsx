"use client";

import { ArrowRight, Clock3, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { OwnedAuction } from "@/lib/supabase/auctions";
import { getAuctionPhotoUrl } from "@/lib/supabase/public-storage";

export function OwnedAuctionCard({ auction, now }: { auction: OwnedAuction; now: number }) {
  const locale = useLocale();
  const t = useTranslations("MyAuctions.card");
  const tLive = useTranslations("MyAuctions.live");
  const ended = new Date(auction.endsAt).getTime() <= now;
  const currency = new Intl.NumberFormat(locale === "sk" ? "sk-SK" : "en-IE", { style: "currency", currency: auction.currency });
  const date = new Intl.DateTimeFormat(locale === "sk" ? "sk-SK" : "en-IE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(auction.endsAt));
  const coverUrl = auction.photoPaths[0] ? getAuctionPhotoUrl(auction.photoPaths[0]) : null;

  return (
    <article><Card className="flex h-full flex-col overflow-hidden p-0">
      <div className="relative flex h-40 items-center justify-center bg-linear-to-br from-primary/20 via-surface-muted to-tertiary/10">
        {coverUrl ? <Image unoptimized src={coverUrl} alt={t("coverPhoto", { title: auction.title })} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" /> : <ImageIcon aria-hidden="true" className="size-10 text-muted-foreground/70" />}
        <span className={`absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-semibold ${ended ? "bg-surface-muted text-muted-foreground" : "bg-primary text-white"}`}>{ended ? t("ended") : t("active")}</span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="line-clamp-2 text-lg font-semibold sm:text-xl">{auction.title}</h2>
        <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground"><Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span>{tLive("endsAt", { date })}</span></p>
        <dl className="mt-5 grid grid-cols-3 divide-x divide-border border-y border-border py-4 text-center">
          <div className="min-w-0 px-2 first:pl-0"><dt className="text-xs text-muted-foreground">{t("currentHighest")}</dt><dd className="mt-2 font-semibold">{auction.currentHighestMinor === null ? t("noBidsYet") : currency.format(auction.currentHighestMinor / 100)}</dd></div>
          <div className="min-w-0 px-2"><dt className="text-xs text-muted-foreground">{t("totalBids")}</dt><dd className="mt-2 font-semibold">{auction.bidCount}</dd></div>
          <div className="min-w-0 px-2 last:pr-0"><dt className="text-xs text-muted-foreground">{t("startingPrice")}</dt><dd className="mt-2 break-words font-semibold">{currency.format(auction.startingPriceMinor / 100)}</dd></div>
        </dl>
        <Link href={`/my-auctions/${auction.id}`} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-soft border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">{t("auctionDetails")}<ArrowRight aria-hidden="true" className="size-4" /></Link>
      </div>
    </Card></article>
  );
}
