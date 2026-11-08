import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Literata, Nunito_Sans } from "next/font/google";
import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QRBid — Simple auctions, shared by QR code",
  description:
    "Create a time-limited auction and share its link or QR code. No public marketplace required.",
};

function SiteHeaderFallback() {
  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-border bg-surface">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-soft font-heading text-xl font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          QRBid
        </Link>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{
        variables: {
          colorPrimary: "var(--primary)",
          colorBackground: "var(--surface)",
          colorForeground: "var(--text)",
          colorMutedForeground: "var(--text-muted)",
          colorDanger: "var(--error)",
          borderRadius: "var(--radius-ui)",
          fontFamily: "var(--font-nunito-sans), sans-serif",
        },
        elements: {
          cardBox: "shadow-soft",
          card: "border border-border",
        },
      }}
    >
      <html
        lang="en"
        data-theme="light"
        className={`${literata.variable} ${nunitoSans.variable} h-full scroll-pt-20 antialiased`}
      >
        <body className="flex min-h-full flex-col">
          <Suspense fallback={<SiteHeaderFallback />}>
            <SiteHeader />
          </Suspense>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
