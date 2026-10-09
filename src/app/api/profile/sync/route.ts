import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServiceClient, getUserFromRequest } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabaseServiceClient();

  const profile = {
    id: user.id,
    email: user.email ?? "",
    name:
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
      null,
    avatar_url:
      (typeof user.user_metadata?.avatar_url === "string" && user.user_metadata.avatar_url) ||
      null,
  };

  const { data, error } = await db
    .from("users")
    .upsert(profile, {
      onConflict: "id",
      ignoreDuplicates: false,
    })
    .select("id,email,name,avatar_url,created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
