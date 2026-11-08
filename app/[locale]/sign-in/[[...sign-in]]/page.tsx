import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";

export async function generateMetadata({ params }: PageProps<"/[locale]/sign-in/[[...sign-in]]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Auth" });
  return { title: `${t("signIn")} — QRBid` };
}

async function LocalizedSignIn({ params }: PageProps<"/[locale]/sign-in/[[...sign-in]]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SignIn path={`/${locale}/sign-in`} signUpUrl={`/${locale}/sign-up`} fallbackRedirectUrl={`/${locale}`} />;
}

export default function SignInPage(props: PageProps<"/[locale]/sign-in/[[...sign-in]]">) {
  return (
    <main className="flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
      <Suspense fallback={<div aria-hidden="true" className="h-96 w-full max-w-md animate-pulse rounded-soft bg-surface-muted motion-reduce:animate-none" />}>
        <LocalizedSignIn {...props} />
      </Suspense>
    </main>
  );
}
