import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

/** Server-side Supabase clients (singletons within the process). */
let anonClient: SupabaseClient | null = null;
let serviceRoleClient: SupabaseClient | null = null;

function required(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getSupabaseUrl() {
  return required("NEXT_PUBLIC_SUPABASE_URL");
}

function getSupabaseAnonKey() {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

function getSupabaseServiceRoleKey() {
  return required("SUPABASE_SERVICE_ROLE_KEY");
}

export function getSupabaseAnonClient() {
  if (!anonClient) {
    anonClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return anonClient;
}

export function getSupabaseServiceClient() {
  if (!serviceRoleClient) {
    serviceRoleClient = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey(),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  return serviceRoleClient;
}

function getTokenFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return req.cookies.get("sb-access-token")?.value ?? null;
}

export async function getUserFromAccessToken(token: string) {
  const supabase = getSupabaseAnonClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  const token = getTokenFromRequest(req);

  if (!token) {
    return null;
  }

  return getUserFromAccessToken(token);
}
