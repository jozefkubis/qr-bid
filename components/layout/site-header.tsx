"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Menu, UserRound, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { CreateAuctionLink } from "@/components/auth/create-auction-link";
import { LanguagePreview } from "@/components/layout/language-preview";
import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/layout/logo";

const navigationLinkClasses =
  "inline-flex min-h-11 items-center rounded-soft px-3 font-semibold text-foreground transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
const createAuctionClasses =
  "inline-flex min-h-11 items-center gap-2 rounded-soft border border-primary bg-primary px-4 py-2 font-semibold text-white hover:border-primary-hover hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";
const signInClasses =
  "inline-flex min-h-11 items-center rounded-soft px-3 font-semibold text-foreground transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function SiteHeader() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("Navigation");
  // Keep the shared server shell and the first hydration render identical.
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot,
  );
  const showCreateAuctionLink = isHydrated && pathname !== "/auctions/new";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-border bg-surface">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:gap-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <Logo closeMenu={closeMenu} />
          <Show when="signed-in">
            <div className="hidden items-center gap-1 lg:flex">
              <Link
                href="/my-auctions"
                aria-current={pathname === "/my-auctions" ? "page" : undefined}
                className="inline-flex min-h-11 min-w-0 items-center rounded-soft px-3 font-semibold text-foreground transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                onClick={closeMenu}
              >
                {t("myAuctions")}
              </Link>
              <Link
                href="/my-bids"
                aria-current={pathname === "/my-bids" ? "page" : undefined}
                className="inline-flex min-h-11 min-w-0 items-center rounded-soft px-3 font-semibold text-foreground transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                onClick={closeMenu}
              >
                {t("myBids")}
              </Link>
            </div>
          </Show>
        </div>

        <nav
          aria-label={t("primaryNavigation")}
          className="hidden items-center gap-2 lg:flex"
        >
          <Link href="/" className={navigationLinkClasses}>
            {t("home")}
          </Link>
          {showCreateAuctionLink ? (
            <CreateAuctionLink className={createAuctionClasses} showArrow />
          ) : null}
          <div className="ml-3 border-l border-border pl-5">
            <LanguagePreview />
          </div>
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl={`/${locale}`}>
              <button type="button" className={signInClasses}>
                {t("signIn")}
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <div className="ml-1 flex min-h-11 items-center">
              <UserButton />
            </div>
          </Show>
        </nav>

        <div className="flex shrink-0 items-center gap-1 lg:hidden">
          <LanguagePreview compact />
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl={`/${locale}`}>
              <button
                type="button"
                aria-label={t("signIn")}
                className="inline-flex size-11 items-center justify-center rounded-soft border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                <UserRound aria-hidden="true" className="size-5" />
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <div className="flex size-11 items-center justify-center">
              <UserButton />
            </div>
          </Show>
          <button
            type="button"
            aria-controls="mobile-navigation"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
            className="inline-flex size-11 items-center justify-center rounded-soft border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
          >
            {isMenuOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <nav
          id="mobile-navigation"
          aria-label={t("mobileNavigation")}
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border px-4 py-3 lg:hidden"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-1">
            <Link
              href="/"
              className={navigationLinkClasses}
              onClick={closeMenu}
            >
              {t("home")}
            </Link>
            <Show when="signed-in">
              <Link
                href="/my-auctions"
                className={navigationLinkClasses}
                onClick={closeMenu}
              >
                {t("myAuctions")}
              </Link>
              <Link
                href="/my-bids"
                className={navigationLinkClasses}
                onClick={closeMenu}
              >
                {t("myBids")}
              </Link>
            </Show>
            {showCreateAuctionLink ? (
              <CreateAuctionLink
                className={navigationLinkClasses}
                onClick={closeMenu}
              />
            ) : null}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
