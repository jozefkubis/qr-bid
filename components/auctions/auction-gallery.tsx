"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { DemoAuction } from "@/data/demo-auctions";

export function AuctionGallery({ auction }: { auction: DemoAuction }) {
  const t = useTranslations("AuctionDetail.gallery");
  const [selected, setSelected] = useState(0);
  const safeSelected = Math.min(selected, Math.max(auction.photoUrls.length - 1, 0));
  const photo = auction.photoUrls[safeSelected];

  return (
    <section aria-label={t("label")} className="min-w-0">
      <div className="relative aspect-4/3 overflow-hidden rounded-soft bg-surface-muted">
        {photo ? <Image unoptimized src={photo} alt={t("photoAlt", { title: auction.title, number: safeSelected + 1 })} fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" /> : (
          <div role="img" aria-label={t("placeholderAlt", { title: auction.title })} className="flex size-full items-center justify-center bg-linear-to-br from-primary/15 via-surface-muted to-tertiary/15">
            <ImageIcon aria-hidden="true" className="size-14 text-muted-foreground/70" />
          </div>
        )}
      </div>
      {auction.photoUrls.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {auction.photoUrls.map((url, index) => (
            <button key={url} type="button" aria-pressed={safeSelected === index} aria-label={t("select", { number: index + 1 })} onClick={() => setSelected(index)} className={`relative aspect-square overflow-hidden rounded-soft border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${safeSelected === index ? "border-primary" : "border-transparent"}`}>
              <Image unoptimized src={url} alt="" fill sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
