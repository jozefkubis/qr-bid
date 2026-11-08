"use server";

import { cookies, headers } from "next/headers";
import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";

export async function saveLocalePreference(locale: AppLocale) {
  if (!routing.locales.includes(locale)) return;

  const requestHeaders = await headers();
  const isSecure = requestHeaders.get("x-forwarded-proto") === "https";
  const cookieStore = await cookies();
  cookieStore.set("qrbid_locale", locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: isSecure,
  });
}
