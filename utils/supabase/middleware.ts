import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // Create an unmodified response.
  // We completely bypass Supabase SSR session refresh for local/demo mode.
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  return supabaseResponse;
};
