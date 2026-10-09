import { NextRequest, NextResponse } from "next/server";

import { ensureProfile, getUserCredits } from "@/lib/credits";
import { getSupabaseServiceClient, getUserFromRequest } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureProfile(user);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const db = getSupabaseServiceClient();
  const [credits, { data }] = await Promise.all([
    getUserCredits(user.id),
    db.from("users").select("plan").eq("id", user.id).single(),
  ]);

  return NextResponse.json({ credits, plan: data?.plan ?? "free" });
}
