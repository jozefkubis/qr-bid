import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Sign in — QRBid" };

export default function SignInPage() {
  return (
    <main className="flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading sign in…</p>}>
        <SignIn
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
        />
      </Suspense>
    </main>
  );
}
