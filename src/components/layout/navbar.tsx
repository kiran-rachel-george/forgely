"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { syncAuthCookies } from "@/lib/auth-client";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface NavbarUser {
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface AppNavbarProps {
  user?: NavbarUser | null;
  showDashboardLink?: boolean;
}

export function AppNavbar({ user, showDashboardLink = false }: AppNavbarProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function handleSignOut() {
    setBusy(true);

    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      syncAuthCookies(null);
      toast.success("Signed out");
      router.push("/");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to sign out";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-100">
          <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
            <Sparkles className="size-4" />
          </div>
          <span className="text-sm font-semibold tracking-wide">Forgely</span>
        </Link>

        <div className="flex items-center gap-2">
          {showDashboardLink && (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
          )}

          {!user ? (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          ) : (
            <>
              <button
                className="rounded-lg p-2 text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
                aria-label="Open settings"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="size-4" />
              </button>
              <Avatar
                src={user.avatar_url}
                fallback={user.name ?? user.email ?? "U"}
                className="size-9"
              />
              <Button variant="outline" size="sm" onClick={handleSignOut} disabled={busy}>
                <LogOut className="mr-1.5 size-4" />
                Sign out
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen} title="Profile settings">
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar src={user.avatar_url} fallback={user.name ?? user.email ?? "U"} className="size-12" />
              <div>
                <p className="font-medium text-slate-100">{user.name ?? "Anonymous User"}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
            <p className="text-sm text-slate-400">
              Account settings are managed through Supabase Auth. You can update metadata directly in your auth provider.
            </p>
          </div>
        ) : null}
      </Dialog>
    </header>
  );
}
