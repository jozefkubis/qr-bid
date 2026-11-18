"use client";

import { Check, Clipboard, Download, ExternalLink, FileDown, MapPin } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createAuctionPoster } from "@/lib/auction-poster";

type AuctionSharingProps = {
  auctionId: string;
  currency: string;
  endsAt: string;
  locale: string;
  location: string | null;
  photoUrl: string | null;
  published: boolean;
  startingPriceMinor: number;
  title: string;
};

function subscribeToOrigin() {
  return () => undefined;
}

export function AuctionSharing({
  auctionId,
  currency,
  endsAt,
  locale,
  location,
  photoUrl,
  published,
  startingPriceMinor,
  title,
}: AuctionSharingProps) {
  const t = useTranslations("AuctionSharing");
  const inputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<"copied" | "manual" | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrFailed, setQrFailed] = useState(false);
  const [posterStatus, setPosterStatus] = useState<"idle" | "loading" | "error">("idle");
  const origin = useSyncExternalStore(
    subscribeToOrigin,
    () => window.location.origin,
    () => "",
  );
  const publicUrl = origin
    ? new URL(`/${locale}/auctions/${auctionId}`, origin).href
    : "";

  useEffect(() => {
    if (!publicUrl) return;
    let cancelled = false;

    void import("qrcode")
      .then(({ toDataURL }) => toDataURL(publicUrl, {
        color: { dark: "#2e322f", light: "#ffffff" },
        errorCorrectionLevel: "M",
        margin: 4,
        width: 320,
      }))
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [publicUrl]);

  const localeCode = locale === "sk" ? "sk-SK" : "en-IE";
  const money = new Intl.NumberFormat(localeCode, {
    style: "currency",
    currency,
  }).format(startingPriceMinor / 100);
  const endDate = new Intl.DateTimeFormat(localeCode, {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    timeZoneName: "short",
    year: "numeric",
  }).format(new Date(endsAt));

  function selectPublicUrl() {
    inputRef.current?.focus();
    inputRef.current?.select();
  }

  async function copyPublicUrl() {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(publicUrl);
      setFeedback("copied");
    } catch {
      selectPublicUrl();
      setFeedback("manual");
    }
  }

  async function downloadPoster() {
    setPosterStatus("loading");
    try {
      const poster = await createAuctionPoster({
        copy: {
          footer: t("poster.footer"),
          publicLink: t("poster.publicLink"),
          scan: t("poster.scan"),
        },
        location,
        photoUrl,
        publicUrl,
        title,
      });
      await poster.download(`qrbid-${auctionId}-poster.pdf`);
      setPosterStatus("idle");
    } catch {
      setPosterStatus("error");
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {published ? (
        <div role="status" className="mb-6 flex items-start gap-3 rounded-soft border border-primary/30 bg-primary/10 p-4 text-primary">
          <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p className="font-semibold">{t("published")}</p>
        </div>
      ) : null}

      <div>
        <p className="text-sm font-semibold text-tertiary">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{published ? t("publishedTitle") : t("title")}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{t("description")}</p>
      </div>

      <Card className="mt-6 p-5 sm:p-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        {location ? (
          <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{location}</span>
          </p>
        ) : null}
        <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">{t("startingPrice")}</dt>
            <dd className="mt-1 font-semibold">{money}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{t("endsAt")}</dt>
            <dd className="mt-1 font-semibold">{endDate}</dd>
          </div>
        </dl>
      </Card>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="p-5 sm:p-6">
          <h2 className="text-xl font-semibold">{t("linkTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("linkDescription")}</p>
          <label htmlFor="public-auction-url" className="mt-5 block text-sm font-semibold">{t("publicLink")}</label>
          <input
            ref={inputRef}
            id="public-auction-url"
            readOnly
            value={publicUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-2 min-h-11 w-full rounded-soft border border-border bg-surface px-3 text-sm"
          />
          <Button type="button" onClick={copyPublicUrl} disabled={!publicUrl} className="mt-4 w-full sm:w-auto">
            <Clipboard aria-hidden="true" className="size-4" />
            {t("copy")}
          </Button>
          {feedback ? (
            <p role="status" className={`mt-3 text-sm font-semibold ${feedback === "copied" ? "text-primary" : "text-tertiary"}`}>
              {t(feedback)}
            </p>
          ) : null}
        </Card>

        <Card className="p-5 text-center sm:p-6">
          <h2 className="text-xl font-semibold">{t("qrTitle")}</h2>
          <div className="mx-auto mt-4 flex aspect-square w-full max-w-72 items-center justify-center rounded-soft bg-white p-2">
            {qrDataUrl ? (
              <Image unoptimized src={qrDataUrl} width={320} height={320} alt={t("qrAlt", { title })} className="h-auto w-full" />
            ) : qrFailed ? (
              <p role="alert" className="text-sm font-semibold text-error">{t("qrError")}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("generating")}</p>
            )}
          </div>
          <a
            href={qrDataUrl || undefined}
            download={`qrbid-${auctionId}.png`}
            aria-disabled={!qrDataUrl}
            className={`mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-soft border border-primary px-4 py-2.5 font-semibold text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${qrDataUrl ? "hover:bg-surface-muted" : "pointer-events-none opacity-60"}`}
          >
            <Download aria-hidden="true" className="size-4" />
            {t("download")}
          </a>
          <Button
            type="button"
            variant="secondary"
            onClick={downloadPoster}
            disabled={!publicUrl}
            isLoading={posterStatus === "loading"}
            className="mt-3 w-full"
          >
            <FileDown aria-hidden="true" className="size-4" />
            {posterStatus === "loading" ? t("poster.generating") : t("poster.download")}
          </Button>
          {posterStatus === "error" ? (
            <p role="alert" className="mt-3 text-sm font-semibold text-error">{t("poster.error")}</p>
          ) : null}
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a href={publicUrl || undefined} aria-disabled={!publicUrl} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-soft border border-primary bg-primary px-5 py-2.5 font-semibold text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${publicUrl ? "hover:border-primary-hover hover:bg-primary-hover" : "pointer-events-none opacity-60"}`}>
          <ExternalLink aria-hidden="true" className="size-4" />
          {t("viewAuction")}
        </a>
        <a href={`/${locale}/my-auctions/${auctionId}`} className="inline-flex min-h-11 items-center justify-center rounded-soft border border-primary px-5 py-2.5 font-semibold text-primary transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
          {t("manageAuction")}
        </a>
      </div>
    </main>
  );
}
