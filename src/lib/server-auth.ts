import { cookies } from "next/headers";

import { getUserFromAccessToken } from "@/lib/supabase-server";

export async function getCurrentUser() {
  const token = cookies().get("sb-access-token")?.value;

  if (!token) {
    return null;
  }

  return getUserFromAccessToken(token);
}
