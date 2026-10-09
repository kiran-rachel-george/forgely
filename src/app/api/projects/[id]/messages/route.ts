import { NextRequest, NextResponse } from "next/server";

import { ensureProjectOwnership, touchProject } from "@/lib/project-db";
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

  const { data, error } = await db
    .from("messages")
    .select("id,project_id,role,content,created_at")
    .eq("project_id", params.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await ensureProjectOwnership(params.id, user.id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const role = body.role === "assistant" ? "assistant" : "user";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "Message content is required" }, { status: 400 });
  }

  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("messages")
    .insert({
      project_id: params.id,
      role,
      content,
    })
    .select("id,project_id,role,content,created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to save message" }, { status: 500 });
  }

  await touchProject(params.id);

  return NextResponse.json({ message: data }, { status: 201 });
}
