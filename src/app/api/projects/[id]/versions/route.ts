import { NextRequest, NextResponse } from "next/server";

import { ensureProjectOwnership, getNextVersionNumber, touchProject } from "@/lib/project-db";
import { getSupabaseServiceClient, getUserFromRequest } from "@/lib/supabase-server";
import { sanitizeComponentCode } from "@/lib/utils";

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
    .from("versions")
    .select("id,project_id,code,prompt,version_number,created_at")
    .eq("project_id", params.id)
    .order("version_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ versions: data ?? [] });
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
  const prompt = typeof body.prompt === "string" && body.prompt.trim() ? body.prompt.trim() : "Manual edit";
  const code = typeof body.code === "string" ? sanitizeComponentCode(body.code) : "";

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  let versionNumber: number;

  try {
    versionNumber = await getNextVersionNumber(params.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to compute version number";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const db = getSupabaseServiceClient();

  const { data, error } = await db
    .from("versions")
    .insert({
      project_id: params.id,
      code,
      prompt,
      version_number: versionNumber,
    })
    .select("id,project_id,code,prompt,version_number,created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to save version" }, { status: 500 });
  }

  await touchProject(params.id);

  return NextResponse.json({ version: data }, { status: 201 });
}
