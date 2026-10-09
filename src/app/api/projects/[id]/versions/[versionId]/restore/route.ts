import { NextRequest, NextResponse } from "next/server";

import { ensureProjectOwnership, getNextVersionNumber, touchProject } from "@/lib/project-db";
import { getSupabaseServiceClient, getUserFromRequest } from "@/lib/supabase-server";

interface Params {
  params: {
    id: string;
    versionId: string;
  };
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

  const db = getSupabaseServiceClient();

  const { data: existingVersion, error: existingError } = await db
    .from("versions")
    .select("id,project_id,code,prompt,version_number")
    .eq("id", params.versionId)
    .eq("project_id", params.id)
    .single();

  if (existingError || !existingVersion) {
    return NextResponse.json({ error: existingError?.message ?? "Version not found" }, { status: 404 });
  }

  let versionNumber: number;

  try {
    versionNumber = await getNextVersionNumber(params.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to compute version number";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data, error } = await db
    .from("versions")
    .insert({
      project_id: params.id,
      code: existingVersion.code,
      prompt: `Restored version ${existingVersion.version_number}`,
      version_number: versionNumber,
    })
    .select("id,project_id,code,prompt,version_number,created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to restore version" }, { status: 500 });
  }

  await touchProject(params.id);

  return NextResponse.json({ version: data }, { status: 201 });
}
