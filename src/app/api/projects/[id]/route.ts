import { NextRequest, NextResponse } from "next/server";

import { ensureProjectOwnership } from "@/lib/project-db";
import { getSupabaseServiceClient, getUserFromRequest } from "@/lib/supabase-server";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await ensureProjectOwnership(params.id, user.id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const db = getSupabaseServiceClient();

  const [{ data: versions, error: versionsError }, { data: messages, error: messagesError }] =
    await Promise.all([
      db
        .from("versions")
        .select("id,project_id,code,prompt,version_number,created_at")
        .eq("project_id", params.id)
        .order("version_number", { ascending: true }),
      db
        .from("messages")
        .select("id,project_id,role,content,created_at")
        .eq("project_id", params.id)
        .order("created_at", { ascending: true }),
    ]);

  if (versionsError || messagesError) {
    return NextResponse.json(
      { error: versionsError?.message ?? messagesError?.message ?? "Failed to load project" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    project,
    versions: versions ?? [],
    messages: messages ?? [],
  });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await ensureProjectOwnership(params.id, user.id);

  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("projects")
    .update({
      name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id,user_id,name,created_at,updated_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to update project" }, { status: 500 });
  }

  return NextResponse.json({ project: data });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await ensureProjectOwnership(params.id, user.id);

  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const db = getSupabaseServiceClient();
  const { error } = await db.from("projects").delete().eq("id", params.id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
