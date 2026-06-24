import { NextResponse, type NextRequest } from "next/server";
import { decrypt } from "@/utils/auth";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  const session = request.cookies.get("session")?.value;

  if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/staff")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login?auth_err=1", request.url));
    }
    const parsed = await decrypt(session);
    if (!parsed) {
      // Clear invalid session on protected route before redirecting
      const redirectResp = NextResponse.redirect(new URL("/login?auth_err=1", request.url));
      redirectResp.cookies.set('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      return redirectResp;
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
