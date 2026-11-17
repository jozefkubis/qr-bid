"use client";

import { useTranslations } from "next-intl";

export default function MyBidsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("MyBids.error");

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <section className="w-full rounded-soft border border-border bg-surface p-8 text-center shadow-soft">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-3 text-muted-foreground">{t("description")}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-soft border border-bid-accent bg-bid-accent px-5 py-2.5 font-semibold text-white transition-colors hover:border-bid-accent-hover hover:bg-bid-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          {t("retry")}
        </button>
      </section>
    </main>
  );
}
