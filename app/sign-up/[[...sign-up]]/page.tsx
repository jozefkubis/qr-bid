import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Sign up — QRBid" };

export default function SignUpPage() {
  return (
    <main className="flex w-full flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading sign up…</p>}>
        <SignUp
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
        />
      </Suspense>
    </main>
  );
}
