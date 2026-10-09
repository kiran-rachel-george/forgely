"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

import { AppNavbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { syncAuthCookies } from "@/lib/auth-client";
import { syncProfile, createProjectFromPrompt } from "@/lib/auth-helpers";
import { getSupabaseBrowserClient } from "@/lib/supabase";

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get("next") ?? "/dashboard";
  const prompt = searchParams.get("prompt")?.trim() ?? "";

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) {
          router.replace(next);
        }
      })
      .catch(() => {
        // ignore
      });
  }, [next, router]);

  async function handleEmailLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        throw new Error(error?.message ?? "Unable to log in");
      }

      syncAuthCookies(data.session);
      await syncProfile(data.session.access_token);

      if (prompt) {
        const projectId = await createProjectFromPrompt(data.session.access_token, prompt);
        const params = new URLSearchParams({ autoPrompt: prompt });
        router.push(`/project/${projectId}?${params.toString()}`);
      } else {
        router.push(next);
      }

      router.refresh();
      toast.success("Welcome back");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log in";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;

      const callback = new URL("/auth/callback", appUrl);
      callback.searchParams.set("next", next);
      if (prompt) {
        callback.searchParams.set("prompt", prompt);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callback.toString(),
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google login failed";
      toast.error(message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppNavbar />
      <main className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-md items-center px-4 py-10">
        <Card className="w-full border-slate-800 bg-slate-900/70">
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <p className="text-sm text-slate-400">Continue building your generated apps.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <Button variant="secondary" className="mt-3 w-full" onClick={handleGoogleLogin} disabled={loading}>
              Continue with Google
            </Button>

            <p className="mt-4 text-center text-sm text-slate-400">
              No account?{" "}
              <Link
                href={`/signup?next=${encodeURIComponent(next)}${prompt ? `&prompt=${encodeURIComponent(prompt)}` : ""}`}
                className="text-cyan-300 hover:text-cyan-200"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}
