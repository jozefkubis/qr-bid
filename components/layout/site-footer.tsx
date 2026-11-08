import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { LanguagePreview } from "@/components/layout/language-preview";
import { Link } from "@/i18n/navigation";

const copyrightYear = new Date().getFullYear();

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const resourceKeys = ["terms", "privacy", "status", "documentation"] as const;
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-soft font-heading text-lg font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            QRBid
          </Link>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
            © {copyrightYear} QRBid SaaS. {t("rights")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div role="group" aria-label={t("resourcesLabel")} className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {resourceKeys.map((key) => (
              <button key={key} type="button" disabled title={t("comingSoonTitle", { resource: t(key) })} className="min-h-11 cursor-not-allowed rounded-soft text-xs text-muted-foreground">
                {t(key)}
              </button>
            ))}
            <span className="text-xs text-muted-foreground">{t("comingSoon")}</span>
          </div>
          <div className="border-l border-border pl-5">
            <Suspense fallback={<div className="min-h-13 min-w-24 rounded-full border border-border bg-surface-muted" />}>
              <LanguagePreview />
            </Suspense>
          </div>
        </div>
      </div>
    </footer>
  );
}
