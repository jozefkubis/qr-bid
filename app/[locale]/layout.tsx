import { ClerkProvider } from "@clerk/nextjs";
import { enUS } from "@clerk/localizations/en-US";
import { skSK } from "@clerk/localizations/sk-SK";
import type { Metadata } from "next";
import { Literata, Nunito_Sans } from "next/font/google";
import Link from "next/link";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { DemoAuctionsProvider } from "@/components/auctions/demo-auctions-provider";
import { routing } from "@/i18n/routing";
import "../globals.css";

const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("title"), description: t("description") };
}

function SiteHeaderFallback({ locale }: { locale: string }) {
  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-border bg-surface">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="inline-flex min-h-11 items-center rounded-soft font-heading text-xl font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          QRBid
        </Link>
      </div>
    </header>
  );
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const clerkLocalization = locale === "sk" ? skSK : enUS;

  return (
    <html
      lang={locale}
      data-theme="light"
      className={`${literata.variable} ${nunitoSans.variable} h-full scroll-pt-20 antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider messages={messages}>
          <ClerkProvider
            afterSignOutUrl={`/${locale}`}
            localization={clerkLocalization}
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
            <Suspense fallback={<SiteHeaderFallback locale={locale} />}>
              <SiteHeader />
            </Suspense>
            <DemoAuctionsProvider>{children}</DemoAuctionsProvider>
          </ClerkProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
