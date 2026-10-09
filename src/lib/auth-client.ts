import type { Session } from "@supabase/supabase-js";

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function syncAuthCookies(session: Session | null) {
  if (!session) {
    clearCookie("sb-access-token");
    clearCookie("sb-refresh-token");
    return;
  }

  setCookie("sb-access-token", session.access_token, session.expires_in ?? 3600);
  setCookie("sb-refresh-token", session.refresh_token, 60 * 60 * 24 * 30);
}
