import Link from "next/link";
import { LanguagePreview } from "@/components/layout/language-preview";

const copyrightYear = new Date().getFullYear();

export function SiteFooter() {
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
            © {copyrightYear} QRBid SaaS. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div role="group" aria-label="Resources — coming soon" className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {["Terms", "Privacy", "Status", "Documentation"].map((label) => (
              <button key={label} type="button" disabled title={`${label} coming soon`} className="min-h-11 cursor-not-allowed rounded-soft text-xs text-muted-foreground">
                {label}
              </button>
            ))}
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </div>
          <div className="border-l border-border pl-5">
            <LanguagePreview />
          </div>
        </div>
      </div>
    </footer>
  );
}
