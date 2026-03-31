import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect");

  // Use custom domain for all redirects (not Supabase URL)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.rentanddrive.net";

  // Validate redirect — internal paths only, no open redirect
  let safeRedirect = "/dashboard";
  if (redirect) {
    try {
      const decoded = decodeURIComponent(redirect);
      if (decoded.startsWith("/")) safeRedirect = decoded;
    } catch {
      // malformed — use default
    }
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] Code exchange failed:", error.message);
      return NextResponse.redirect(
        new URL(`/auth/signin?error=link_expired&redirect=${encodeURIComponent(safeRedirect)}`, siteUrl)
      );
    }
  }

  return NextResponse.redirect(new URL(safeRedirect, siteUrl));
}
