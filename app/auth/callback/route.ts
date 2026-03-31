import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * /auth/callback
 *
 * Handles three flows:
 * 1. Email confirmation (signup)
 * 2. Password reset redirect
 * 3. Google OAuth redirect
 *
 * In all cases, the ?redirect= param is preserved and the user
 * is sent back to their original destination (e.g. /booking/verify?...)
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;

  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect");

  // Decode and validate the redirect destination
  // Only allow internal redirects (no external URL hijacking)
  let safeRedirect = "/dashboard";
  if (redirect) {
    try {
      const decoded = decodeURIComponent(redirect);
      // Must be a relative path starting with /
      if (decoded.startsWith("/")) {
        safeRedirect = decoded;
      }
    } catch {
      // malformed — use default
    }
  }

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] Code exchange failed:", error.message);
      // Send to signin with error param so we can show a message
      return NextResponse.redirect(
        new URL(`/auth/signin?error=link_expired&redirect=${encodeURIComponent(safeRedirect)}`, origin)
      );
    }
  }

  // Redirect to original destination — booking page, dashboard, etc.
  return NextResponse.redirect(new URL(safeRedirect, origin));
}
