import { NextRequest, NextResponse } from "next/server";

import { STARTER_FILES } from "@/lib/constants";
import { getSupabaseServiceClient, getUserFromRequest } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabaseServiceClient();

  const { data: projects, error } = await db
    .from("projects")
    .select("id,user_id,name,created_at,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Batch-fetch latest version for all projects in a single query
  const projectIds = (projects ?? []).map((p) => p.id);
  const { data: latestVersions } = projectIds.length > 0
    ? await db
        .from("versions")
        .select("project_id,version_number,code,prompt")
        .in("project_id", projectIds)
        .order("version_number", { ascending: false })
    : { data: [] };

  // Build a lookup: project_id -> latest version
  const latestByProject = new Map<string, { version_number: number; code: string; prompt: string }>();
  for (const version of latestVersions ?? []) {
    // First entry per project_id is the latest (ordered desc)
    if (!latestByProject.has(version.project_id)) {
      latestByProject.set(version.project_id, version);
    }
  }

  const projectsWithLatest = (projects ?? []).map((project) => {
    const latest = latestByProject.get(project.id);
    return {
      ...project,
      latest_version_number: latest?.version_number ?? null,
      latest_code: latest?.code ?? null,
      latest_prompt: latest?.prompt ?? null,
    };
  });

  return NextResponse.json({ projects: projectsWithLatest });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Untitled Project";
  const initialPrompt = typeof body.prompt === "string" && body.prompt.trim() ? body.prompt.trim() : "Initial scaffold";

  const db = getSupabaseServiceClient();

  const { data: project, error: projectError } = await db
    .from("projects")
    .insert({
      user_id: user.id,
      name,
    })
    .select("id,user_id,name,created_at,updated_at")
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: projectError?.message ?? "Failed to create project" }, { status: 500 });
  }

  // Store the initial version as JSON with files
  const starterCode = JSON.stringify({
    plan: ["Set up project structure"],
    files: STARTER_FILES,
    description: "Initial project scaffold",
  });

  const { error: versionError } = await db.from("versions").insert({
    project_id: project.id,
    code: starterCode,
    prompt: initialPrompt,
    version_number: 1,
  });

  if (versionError) {
    await db.from("projects").delete().eq("id", project.id);
    return NextResponse.json({ error: versionError.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      project: {
        ...project,
        latest_version_number: 1,
        latest_code: starterCode,
        latest_prompt: initialPrompt,
      },
    },
    { status: 201 },
  );
}
