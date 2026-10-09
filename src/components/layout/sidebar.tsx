"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Home,
  Search,
  Compass,
  LayoutGrid,
  Star,
  User,
  Users,
  QrCode,
  Zap,
  Settings,
  ChevronDown,
  Sparkles,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { syncAuthCookies } from "@/lib/auth-client";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface SidebarProps {
  user?: {
    name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
  recentProjects?: Array<{ id: string; name: string }>;
}

export function Sidebar({ user, recentProjects = [] }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Search", href: "#", icon: Search },
    { label: "Resources", href: "#", icon: Compass },
  ];

  const projectFilters = [
    { label: "All projects", href: "/dashboard", icon: LayoutGrid },
    { label: "Starred", href: "#", icon: Star },
    { label: "Created by me", href: "#", icon: User },
    { label: "Shared with me", href: "#", icon: Users },
  ];

  const initial = user?.name?.charAt(0) || user?.email?.charAt(0) || "U";

  async function handleSignOut() {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      syncAuthCookies(null);
      toast.success("Signed out");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to sign out");
    }
  }

  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-[#2a2a2a] bg-[#1a1a1a]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-teal-400">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-white">My Forgely</span>
        <ChevronDown className="ml-auto h-3.5 w-3.5 text-[#666]" />
      </div>

      {/* Nav */}
      <nav className="space-y-0.5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-[#a1a1a1] transition-colors hover:bg-[#222] hover:text-white",
                isActive && "bg-[#222] text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Projects section */}
      <div className="mt-5 px-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#666]">Projects</p>
      </div>
      <nav className="mt-1.5 space-y-0.5 px-2">
        {projectFilters.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] text-[#a1a1a1] transition-colors hover:bg-[#222] hover:text-white"
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Recents */}
      <div className="mt-5 px-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#666]">Recents</p>
      </div>
      <div className="mt-1.5 flex-1 overflow-y-auto px-3">
        {recentProjects.length === 0 ? (
          <p className="px-1 text-[12px] text-[#555]">No recent projects</p>
        ) : (
          <div className="space-y-0.5">
            {recentProjects.slice(0, 5).map((p) => (
              <Link
                key={p.id}
                href={`/project/${p.id}`}
                className="block truncate rounded-lg px-2 py-1.5 text-[12px] text-[#a1a1a1] transition-colors hover:bg-[#222] hover:text-white"
              >
                {p.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom cards */}
      <div className="mt-auto space-y-2 px-3 pb-3">
        {/* Share card */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1c1c1c] p-3">
          <div className="flex items-center gap-2.5">
            <QrCode className="h-4 w-4 shrink-0 text-[#a1a1a1]" />
            <div>
              <p className="text-[12px] font-medium text-white">Share Forgely</p>
              <p className="text-[11px] text-[#666]">100 credits per paid referral</p>
            </div>
          </div>
        </div>

        {/* Upgrade card */}
        <div className="rounded-xl border border-[#2a2a2a] bg-[#1c1c1c] p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <div>
              <p className="text-[12px] font-medium text-white">Upgrade to Pro</p>
              <p className="text-[11px] text-[#666]">Unlock more benefits</p>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="flex items-center gap-2 pt-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-teal-400 text-[12px] font-bold text-white">
            {initial.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-white">{user?.name || "User"}</p>
            <p className="truncate text-[10px] text-[#666]">{user?.email || ""}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-md p-1 text-[#666] transition-colors hover:bg-[#222] hover:text-white"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
          <button className="rounded-md p-1 text-[#666] transition-colors hover:bg-[#222] hover:text-white">
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
