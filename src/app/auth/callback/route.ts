import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceClient } from "@/lib/supabase-server";

const ACCESS_COOKIE = "sb-access-token";
const REFRESH_COOKIE = "sb-refresh-token";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") ?? "/dashboard";
  const prompt = req.nextUrl.searchParams.get("prompt");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", req.url));
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.redirect(new URL("/login?error=missing_env", req.url));
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }

  const db = getSupabaseServiceClient();
  const callbackUser = data.user;

  if (callbackUser) {
    const { error: profileError } = await db.from("users").upsert(
      {
        id: callbackUser.id,
        email: callbackUser.email ?? "",
        name:
          (typeof callbackUser.user_metadata?.full_name === "string" &&
            callbackUser.user_metadata.full_name) ||
          (typeof callbackUser.user_metadata?.name === "string" &&
            callbackUser.user_metadata.name) ||
          null,
        avatar_url:
          (typeof callbackUser.user_metadata?.avatar_url === "string" &&
            callbackUser.user_metadata.avatar_url) ||
          null,
      },
      {
        onConflict: "id",
      },
    );

    if (profileError) {
      return NextResponse.redirect(new URL("/login?error=profile_sync_failed", req.url));
    }
  }

  const redirectUrl = new URL(next, req.url);

  if (prompt) {
    redirectUrl.searchParams.set("prompt", prompt);
  }

  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set(ACCESS_COOKIE, data.session.access_token, {
    maxAge: data.session.expires_in ?? 3600,
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });

  response.cookies.set(REFRESH_COOKIE, data.session.refresh_token, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
