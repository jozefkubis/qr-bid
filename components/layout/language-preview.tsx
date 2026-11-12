"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { saveLocalePreference } from "@/lib/locale-preference";

const locales: AppLocale[] = ["en", "sk"];

export function LanguagePreview() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("LanguageSwitcher");
  const [isPending, startTransition] = useTransition();

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
