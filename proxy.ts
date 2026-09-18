import { NextResponse, type NextRequest } from "next/server";
import { decrypt, encrypt } from "@/utils/auth";
import { DEFAULT_LOCALE, LANGUAGES } from "@/lib/i18n/config";

const LOCALES = Object.keys(LANGUAGES); // vi, en, ko, zh-CN, ja, th, fr, de, es
const CANONICAL_HOST = "minhair.vercel.app";

export async function proxy(request: NextRequest) {
  // Domain canonical: redirect min-nail-hair.vercel.app -> minhair.vercel.app (308)
  const host = request.headers.get("host") || "";
  if (host && host !== CANONICAL_HOST && (host.includes("min-nail-hair") || host.includes("minnailhair"))) {
    const url = new URL(request.url);
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }
  const isPreviewHost = host.includes("vercel.app") && host !== CANONICAL_HOST;

  // i18n: detect /{locale}/ prefix -> set cookie + rewrite to non-prefixed path for routing
  const pathname = request.nextUrl.pathname;
  const firstSeg = pathname.split("/")[1];
  const hasLocalePrefix = LOCALES.includes(firstSeg);
  let localeFromPath: string | null = null;
  let rewriteUrl: URL | null = null;
  if (hasLocalePrefix) {
    localeFromPath = firstSeg;
    // Strip locale prefix for internal routing (keep distinct URL in browser via rewrite)
    const stripped = pathname.replace(`/${firstSeg}`, "") || "/";
    rewriteUrl = new URL(stripped + request.nextUrl.search, request.url);
  } else if (pathname === "/" || pathname === "") {
    // x-default -> canonical vi, redirect to /vi for hreflang clarity (keep root also accessible)
    // Do not force redirect for bots that request root, but set header
  }

  let response: NextResponse;
  if (rewriteUrl) {
    response = NextResponse.rewrite(rewriteUrl);
    // Persist locale to cookie for next requests / layout
    response.cookies.set("locale", localeFromPath!, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    response.headers.set("x-locale", localeFromPath!);
    response.headers.set("x-locale-path", pathname);
  } else {
    response = NextResponse.next();
    // If no prefix, ensure locale cookie exists; layout will fallback to DEFAULT_LOCALE
    const cookieLocale = request.cookies.get("locale")?.value;
    const lang = cookieLocale && LANGUAGES[cookieLocale] ? cookieLocale : DEFAULT_LOCALE;
    response.headers.set("x-locale", lang);
  }
  if (isPreviewHost) response.headers.set("X-Robots-Tag", "noindex, nofollow");

  const session = request.cookies.get("session")?.value;

  if (session) {
    const parsed = await decrypt(session);
    if (parsed) {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const newSession = await encrypt({
        user: parsed.user,
        expires,
      });
      response.cookies.set("session", newSession, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
    }
  }

  const freshSession = response.cookies.get("session")?.value || session;

  // Normalize path for auth check (strip locale prefix)
  const authPath = hasLocalePrefix ? pathname.replace(`/${firstSeg}`, "") || "/" : pathname;
  if (authPath.startsWith("/admin") || authPath.startsWith("/staff")) {
    if (!freshSession) {
      return NextResponse.redirect(new URL("/login?auth_err=1", request.url));
    }
    const parsed = await decrypt(freshSession);
    if (!parsed) {
      const redirectRes = NextResponse.redirect(new URL("/login?auth_err=1", request.url));
      redirectRes.cookies.set("session", "", { maxAge: 0, path: "/" });
      return redirectRes;
    }
    const user = parsed.user;

    if (authPath.startsWith("/admin") && user.role !== "ADMIN" && user.role !== "MANAGER") {
      return NextResponse.redirect(new URL("/login?auth_err=1", request.url));
    }
    if (authPath.startsWith("/staff") && user.role !== "STAFF" && user.role !== "MANAGER") {
      return NextResponse.redirect(new URL("/login?auth_err=1", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|css|js|woff2)$).*)",
  ],
};
