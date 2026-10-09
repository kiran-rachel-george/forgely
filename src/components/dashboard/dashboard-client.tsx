"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Send, Mic, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { CreateProjectModal } from "@/components/dashboard/create-project-modal";
import { ProjectCard } from "@/components/dashboard/project-card";
import { Sidebar } from "@/components/layout/sidebar";
import { CreditBadge } from "@/components/ui/credit-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCredits } from "@/hooks/useCredits";
import { apiFetch } from "@/lib/api-client";
import type { Project } from "@/lib/types";

interface DashboardClientProps {
  user: {
    email: string | null;
    name: string | null;
    avatar_url: string | null;
  };
  initialPrompt?: string;
}

function inferProjectName(prompt: string) {
  const compact = prompt.trim().replace(/\s+/g, " ");
  if (!compact) return "Untitled Project";
  return compact.length > 42 ? `${compact.slice(0, 42)}...` : compact;
}

export function DashboardClient({ user, initialPrompt = "" }: DashboardClientProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [processingPrompt, setProcessingPrompt] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"projects" | "templates">("projects");
  const router = useRouter();
  const { credits } = useCredits();

  const hasProjects = useMemo(() => projects.length > 0, [projects]);
  const displayName = user.name || user.email?.split("@")[0] || "there";
  const recentProjects = useMemo(
    () => projects.slice(0, 5).map((p) => ({ id: p.id, name: p.name })),
    [projects],
  );

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiFetch<{ projects: Project[] }>("/api/projects");
      setProjects(payload.projects);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load projects";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(
    async (name: string, promptText?: string) => {
      try {
        const payload = await apiFetch<{ project: Project }>("/api/projects", {
          method: "POST",
          body: JSON.stringify({ name, prompt: promptText }),
        });
        setProjects((prev) => [payload.project, ...prev]);
        if (promptText) {
          const query = new URLSearchParams({ autoPrompt: promptText });
          router.push(`/project/${payload.project.id}?${query.toString()}`);
        } else {
          router.push(`/project/${payload.project.id}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to create project";
        toast.error(message);
      }
    },
    [router],
  );

  const renameProject = useCallback(async (projectId: string, name: string) => {
    try {
      const payload = await apiFetch<{ project: Project }>(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      setProjects((prev) =>
        prev.map((project) => (project.id === projectId ? { ...project, ...payload.project } : project)),
      );
      toast.success("Project renamed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to rename project";
      toast.error(message);
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await apiFetch<{ success: boolean }>(`/api/projects/${projectId}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      toast.success("Project deleted");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete project";
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!initialPrompt || processingPrompt || loading) return;
    setProcessingPrompt(true);
    void createProject(inferProjectName(initialPrompt), initialPrompt);
  }, [createProject, initialPrompt, loading, processingPrompt]);

  async function handlePromptSubmit() {
    const value = prompt.trim();
    if (!value) return;
    setGenerating(true);
    try {
      await createProject(inferProjectName(value), value);
    } finally {
      setGenerating(false);
      setPrompt("");
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Sidebar */}
      <Sidebar user={user} recentProjects={recentProjects} />

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        {/* Hero Section */}
        <div className="gradient-mesh flex flex-1 flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[640px] text-center"
          >
            <CreditBadge credits={credits} className="mb-4" />
            <h1 className="text-[32px] font-semibold leading-tight text-white">
              Let&apos;s build something, {displayName}
            </h1>

            {/* Prompt Input */}
            <div className="mt-6 rounded-2xl border border-[#2a2a2a] bg-[#1c1c1c] p-4 shadow-2xl">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handlePromptSubmit();
                  }
                }}
                placeholder="Ask Forgely to create a"
                className="w-full bg-transparent text-[15px] text-white placeholder:text-[#666] focus:outline-none"
                disabled={generating}
              />
              <div className="mt-3 flex items-center justify-between">
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#666] transition hover:bg-[#333] hover:text-white">
                  <Plus className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#a1a1a1] transition hover:bg-[#333] hover:text-white">
                    Plan
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#666] transition hover:bg-[#333] hover:text-white">
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => void handlePromptSubmit()}
                    disabled={generating || !prompt.trim()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white transition hover:bg-sky-400 disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Projects Section */}
        <div className="border-t border-[#2a2a2a] bg-[#111] px-6 py-5">
          {/* Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("projects")}
                className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
                  activeTab === "projects"
                    ? "bg-[#2a2a2a] text-white"
                    : "text-[#666] hover:text-[#a1a1a1]"
                }`}
              >
                My projects
              </button>
              <button
                onClick={() => setActiveTab("templates")}
                className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
                  activeTab === "templates"
                    ? "bg-[#2a2a2a] text-white"
                    : "text-[#666] hover:text-[#a1a1a1]"
                }`}
              >
                Templates
              </button>
            </div>
            <button className="flex items-center gap-1 text-[13px] text-[#a1a1a1] transition hover:text-white">
              Browse all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Project Grid */}
          {loading ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-[180px] rounded-xl bg-[#1c1c1c]" />
              ))}
            </div>
          ) : hasProjects ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProjectCard project={project} onDelete={deleteProject} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-[14px] text-[#666]">No projects yet. Type a prompt above to get started.</p>
            </div>
          )}
        </div>
      </main>

      <CreateProjectModal open={createOpen} onOpenChange={setCreateOpen} onCreate={createProject} />
    </div>
  );
}
