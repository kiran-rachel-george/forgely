import type { User } from "@supabase/supabase-js";

import { getSupabaseServiceClient } from "@/lib/supabase-server";

const MAX_CAS_RETRIES = 5;

/** Makes sure the user has a profile row without overwriting an existing balance. */
export async function ensureProfile(user: User): Promise<void> {
  const db = getSupabaseServiceClient();
  const { error } = await db
    .from("users")
    .upsert({ id: user.id, email: user.email ?? "" }, { onConflict: "id", ignoreDuplicates: true });

  if (error) {
    throw new Error(`Could not load your profile: ${error.message}`);
  }
}

export async function getUserCredits(userId: string): Promise<number> {
  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error || !data) return 0;
  return data.credits ?? 0;
}

/**
 * Atomically changes the balance by `delta`. The update only applies if the balance is
 * still the value we read (compare-and-swap), so concurrent requests cannot double-spend.
 */
async function adjustCredits(
  userId: string,
  delta: number,
): Promise<{ ok: boolean; remaining: number }> {
  const db = getSupabaseServiceClient();

  for (let attempt = 0; attempt < MAX_CAS_RETRIES; attempt++) {
    const current = await getUserCredits(userId);
    const next = current + delta;

    if (next < 0) {
      return { ok: false, remaining: current };
    }

    const { data, error } = await db
      .from("users")
      .update({ credits: next })
      .eq("id", userId)
      .eq("credits", current)
      .select("credits");

    if (error) {
      throw new Error(error.message);
    }

    if (data && data.length > 0) {
      return { ok: true, remaining: data[0].credits };
    }
    // Balance changed under us; read it again and retry.
  }

  throw new Error("Could not update credits, please try again.");
}

/** Takes one credit. Returns ok=false (and changes nothing) when the balance is empty. */
export function deductCredit(userId: string) {
  return adjustCredits(userId, -1);
}

/** Gives a credit back, e.g. when generation failed and nothing was saved. */
export function refundCredit(userId: string) {
  return adjustCredits(userId, 1);
}
