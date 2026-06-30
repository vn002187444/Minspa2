import { NextResponse, type NextRequest } from "next/server";
import { decrypt, encrypt } from "@/utils/auth";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next();

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

  if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/staff")) {
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

    if (request.nextUrl.pathname.startsWith("/admin") && user.role !== "ADMIN" && user.role !== "MANAGER") {
      return NextResponse.redirect(new URL("/login?auth_err=1", request.url));
    }
    if (request.nextUrl.pathname.startsWith("/staff") && user.role !== "STAFF" && user.role !== "MANAGER") {
      return NextResponse.redirect(new URL("/login?auth_err=1", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
