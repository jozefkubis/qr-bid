import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

export async function generateMetadata({ params }: PageProps<"/[locale]/sign-up/[[...sign-up]]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: `${t("signUp")} — QRBid` };
}

async function LocalizedSignUp({ params }: PageProps<"/[locale]/sign-up/[[...sign-up]]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SignUp path={`/${locale}/sign-up`} signInUrl={`/${locale}/sign-in`} fallbackRedirectUrl={`/${locale}`} />;
}

export default function SignUpPage(props: PageProps<"/[locale]/sign-up/[[...sign-up]]">) {
  return (
    <main className="flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
      <Suspense fallback={<div aria-hidden="true" className="h-96 w-full max-w-md animate-pulse rounded-soft bg-surface-muted motion-reduce:animate-none" />}>
        <LocalizedSignUp {...props} />
      </Suspense>
    </main>
  );
}
