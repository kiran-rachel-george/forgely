import { getSupabaseServiceClient } from "@/lib/supabase-server";

export async function ensureProjectOwnership(projectId: string, userId: string) {
  const db = getSupabaseServiceClient();

  const { data, error } = await db
    .from("projects")
    .select("id,user_id,name,created_at,updated_at")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getNextVersionNumber(projectId: string) {
  const db = getSupabaseServiceClient();
  const { data, error } = await db
    .from("versions")
    .select("version_number")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.version_number ?? 0) + 1;
}

export async function touchProject(projectId: string) {
  const db = getSupabaseServiceClient();

  const { error } = await db
    .from("projects")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) {
    throw new Error(error.message);
  }
}
