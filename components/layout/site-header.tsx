"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { CreateAuctionLink } from "@/components/auth/create-auction-link";
import { LanguagePreview } from "@/components/layout/language-preview";

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
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-soft font-heading text-xl font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          onClick={closeMenu}
        >
          QRBid
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-2 lg:flex">
          <Link href="/" className={navigationLinkClasses}>
            Home
          </Link>
          {showCreateAuctionLink ? (
            <CreateAuctionLink className={createAuctionClasses} showArrow />
          ) : null}
          <div className="ml-3 border-l border-border pl-5">
            <LanguagePreview />
          </div>
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/">
              <button type="button" className={signInClasses}>Sign in</button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <div className="ml-1 flex min-h-11 items-center">
              <UserButton />
            </div>
          </Show>
        </nav>

        <button
          type="button"
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="inline-flex size-11 items-center justify-center rounded-soft border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:hidden"
          onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
        >
          {isMenuOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>
      </div>

      {isMenuOpen ? (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border px-4 py-3 lg:hidden"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-1">
            <Link href="/" className={navigationLinkClasses} onClick={closeMenu}>
              Home
            </Link>
            {showCreateAuctionLink ? (
              <CreateAuctionLink
                className={navigationLinkClasses}
                onClick={closeMenu}
              />
            ) : null}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-3">
              <div className="ml-auto border-l border-border pl-5">
                <LanguagePreview />
              </div>
              <Show when="signed-out">
                <SignInButton mode="modal" fallbackRedirectUrl="/">
                  <button type="button" className={signInClasses} onClick={closeMenu}>
                    Sign in
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <div className="flex min-h-11 items-center">
                  <UserButton />
                </div>
              </Show>
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
