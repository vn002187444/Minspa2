import { NextResponse, type NextRequest } from "next/server";
import { decrypt } from "@/utils/auth";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  // 1. First, refresh supabase auth session as requested
  let response = await updateSession(request);

  // 2. Next, apply our custom cookie-based authorization
  const session = request.cookies.get("session")?.value;
  
  if (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/staff")) {
    console.log(`[MIDDLEWARE] Checking authorization for path: ${request.nextUrl.pathname}`);
    if (!session) {
      console.warn(`[MIDDLEWARE WARNING] No session cookie found for ${request.nextUrl.pathname}. Redirecting to /login`);
      return NextResponse.redirect(new URL("/login?auth_err=1", request.url));
    }
    try {
      const parsed = await decrypt(session);
      const user = parsed.user;
      console.log(`[MIDDLEWARE] Session decrypted. User ID: ${user.id}, Role: ${user.role}, Username: ${user.username}`);

      if (request.nextUrl.pathname.startsWith("/admin") && user.role !== "ADMIN" && user.role !== "MANAGER") {
        console.warn(`[MIDDLEWARE WARNING] Access denied. Path is /admin but user role is ${user.role}`);
        return NextResponse.redirect(new URL("/login?auth_err=1", request.url));
      }
      if (request.nextUrl.pathname.startsWith("/staff") && user.role !== "STAFF" && user.role !== "MANAGER") {
        console.warn(`[MIDDLEWARE WARNING] Access denied. Path is /staff but user role is ${user.role}`);
        return NextResponse.redirect(new URL("/login?auth_err=1", request.url));
      }
      
      console.log(`[MIDDLEWARE] Authorization successful for ${request.nextUrl.pathname}`);
    } catch (error) {
      console.error(`[MIDDLEWARE CRITICAL ERROR] Session decryption failed for ${request.nextUrl.pathname}:`, error);
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
