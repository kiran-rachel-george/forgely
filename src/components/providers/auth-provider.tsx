"use client";

import { useEffect } from "react";

import { syncAuthCookies } from "@/lib/auth-client";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth
      .getSession()
      .then(({ data }) => {
        syncAuthCookies(data.session);
      })
      .catch(() => {
        syncAuthCookies(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncAuthCookies(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return <>{children}</>;
}
