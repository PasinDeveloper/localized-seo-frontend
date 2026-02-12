import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/*
  Locale routing middleware.

  Redirects non-localized routes to the default locale while excluding
  Next internals and static asset paths.
*/

const SUPPORTED_LOCALES = ["en", "fr"] as const;

function hasLocalePrefix(pathname: string): boolean {
  return SUPPORTED_LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/locales") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (hasLocalePrefix(pathname)) {
    return NextResponse.next();
  }

  const nextUrl = request.nextUrl.clone();
  // Default all bare routes to English locale.
  nextUrl.pathname = `/en${pathname}`;

  return NextResponse.redirect(nextUrl);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};

