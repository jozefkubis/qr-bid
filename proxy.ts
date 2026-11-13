import { clerkMiddleware } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

function preferredLocale(request: NextRequest) {
  const savedLocale = request.cookies.get("qrbid_locale")?.value;
  if (savedLocale === "en" || savedLocale === "sk") return savedLocale;

  const candidates = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((item, index) => {
      const [tag, ...parameters] = item.trim().toLowerCase().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const quality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1;
      return { language: tag.split("-")[0], quality: Number.isFinite(quality) ? quality : 0, index };
    })
    .filter((item) => item.language === "en" || item.language === "sk")
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  return candidates[0]?.language === "sk" ? "sk" : routing.defaultLocale;
}

function hasLocalePrefix(pathname: string) {
  return routing.locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));
}

export default clerkMiddleware(async (auth, request) => {
  if (hasLocalePrefix(request.nextUrl.pathname)) {
    const privateRoute = request.nextUrl.pathname.match(
      /^\/(en|sk)\/(?:auctions\/new|my-auctions(?:\/[^/]+)?)\/?$/,
    );
    if (privateRoute) {
      const signInUrl = new URL(`/${privateRoute[1]}/sign-in`, request.url);
      signInUrl.searchParams.set("redirect_url", request.nextUrl.pathname);
      await auth.protect({ unauthenticatedUrl: signInUrl.toString() });
    }
    return handleI18nRouting(request);
  }

  const locale = preferredLocale(request);
  const localizedPath = request.nextUrl.pathname === "/"
    ? `/${locale}`
    : `/${locale}${request.nextUrl.pathname}`;
  const destination = request.nextUrl.clone();
  destination.pathname = localizedPath;
  return NextResponse.redirect(destination);
});

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
