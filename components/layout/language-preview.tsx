"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useRef, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { saveLocalePreference } from "@/lib/locale-preference";

const locales: AppLocale[] = ["en", "sk"];

export function LanguagePreview({ compact = false }: { compact?: boolean }) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("LanguageSwitcher");
  const [isPending, startTransition] = useTransition();
  const compactMenuRef = useRef<HTMLDetailsElement>(null);

  function switchLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;
    if (pathname === "/auctions/new" && !window.confirm(t("formWarning"))) return;

    const query = searchParams.toString();
    const destination = `${pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    startTransition(async () => {
      await saveLocalePreference(nextLocale);
      router.replace(destination, { locale: nextLocale });
    });
  }

  if (compact) {
    return (
      <details ref={compactMenuRef} className="group relative">
        <summary
          aria-label={t("label")}
          className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center gap-0.5 rounded-soft border border-border bg-surface px-2 text-xs font-bold text-primary transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden"
        >
          {locale.toUpperCase()}
          <ChevronDown aria-hidden="true" className="size-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <div role="group" aria-label={t("label")} aria-busy={isPending || undefined} className="absolute top-full right-0 z-60 mt-2 grid min-w-28 gap-1 rounded-soft border border-border bg-surface p-1 shadow-lg">
          {locales.map((item) => {
            const isActive = item === locale;
            return (
              <button
                key={item}
                type="button"
                aria-pressed={isActive}
                disabled={isPending}
                onClick={() => {
                  compactMenuRef.current?.removeAttribute("open");
                  switchLocale(item);
                }}
                className={`min-h-11 rounded-soft px-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-wait ${isActive ? "bg-surface-muted font-bold text-primary" : "text-foreground hover:bg-surface-muted"}`}
              >
                {item === "en" ? t("english", { current: "" }) : t("slovak", { current: "" })}
              </button>
            );
          })}
        </div>
      </details>
    );
  }

  return (
    <div role="group" aria-label={t("label")} aria-busy={isPending || undefined} className="inline-flex rounded-full border border-border bg-surface-muted p-1">
      {locales.map((item) => {
        const isActive = item === locale;
        return (
          <button
            key={item}
            type="button"
            aria-pressed={isActive}
            aria-label={t(item === "en" ? "english" : "slovak", { current: isActive ? t("current") : "" })}
            disabled={isPending}
            onClick={() => switchLocale(item)}
            className={`min-h-11 min-w-11 cursor-pointer rounded-full px-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-wait ${isActive ? "bg-surface font-bold text-primary shadow-sm" : "text-muted-foreground hover:text-primary"}`}
          >
            {item.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
