"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const navigationLinkClasses =
  "inline-flex min-h-11 items-center rounded-soft px-3 font-semibold text-foreground transition-colors hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-soft font-heading text-xl font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          onClick={closeMenu}
        >
          QRBid
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 md:flex">
          <Link href="/" className={navigationLinkClasses}>
            Home
          </Link>
          <Link href="/auctions/new" className={navigationLinkClasses}>
            Create an auction
          </Link>
        </nav>

        <button
          type="button"
          aria-controls="mobile-navigation"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="inline-flex size-11 items-center justify-center rounded-soft border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus md:hidden"
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
          className="border-t border-border px-4 py-3 md:hidden"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-1">
            <Link href="/" className={navigationLinkClasses} onClick={closeMenu}>
              Home
            </Link>
            <Link
              href="/auctions/new"
              className={navigationLinkClasses}
              onClick={closeMenu}
            >
              Create an auction
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
