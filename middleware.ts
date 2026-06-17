import { NextResponse, type NextRequest } from "next/server";
import { decrypt, encrypt } from "@/utils/auth";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  const session = request.cookies.get("session")?.value;

  if (session) {
    try {
      const parsed = await decrypt(session);
      const user = parsed.user;
      const newSession = await encrypt({ user });
      response.cookies.set('session', newSession, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60,
      });
    } catch {
      response.cookies.set('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }
  }

  const freshSession = response.cookies.get("session")?.value || session;

  if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/staff")) {
    if (!freshSession) {
      return NextResponse.redirect(new URL("/login?auth_err=1", request.url));
    }
    try {
      const parsed = await decrypt(freshSession);
      const user = parsed.user;

      if (request.nextUrl.pathname.startsWith("/admin") && user.role !== "ADMIN" && user.role !== "MANAGER") {
        return NextResponse.redirect(new URL("/login?auth_err=1", request.url));
      }
      if (request.nextUrl.pathname.startsWith("/staff") && user.role !== "STAFF" && user.role !== "MANAGER") {
        return NextResponse.redirect(new URL("/login?auth_err=1", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login?auth_err=1", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
