"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/api-client";

/** Loads the signed-in user's credit balance. `credits` is null until the first load finishes. */
export function useCredits() {
  const [credits, setCredits] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const profile = await apiFetch<{ credits: number }>("/api/profile");
      setCredits(profile.credits);
    } catch {
      // Keep the last known balance; the server still enforces the limit.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { credits, refresh };
}
