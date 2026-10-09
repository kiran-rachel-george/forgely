"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

import { TopBar } from "@/components/topbar/top-bar";
import { PromptInput } from "@/components/home/prompt-input";
import { TemplateSuggestions } from "@/components/home/template-suggestions";
import { apiFetch } from "@/lib/api-client";
import { inferProjectName } from "@/lib/utils";
import type { Project } from "@/lib/types";

interface HomePageProps {
  user: {
    email: string | null;
    name: string | null;
    avatar_url: string | null;
  };
  initialPrompt?: string;
}

export function HomePage({ user, initialPrompt = "" }: HomePageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [processingPrompt, setProcessingPrompt] = useState(false);
  const router = useRouter();

  const displayName = user.name || user.email?.split("@")[0] || "there";

  const tabs = useMemo(
    () =>
      projects.slice(0, 8).map((p) => ({
        id: p.id,
        name: p.name,
        active: false,
      })),
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
    async (name: string, promptText?: string, projectType?: string, aiModel?: string) => {
      try {
        const payload = await apiFetch<{ project: Project }>("/api/projects", {
          method: "POST",
          body: JSON.stringify({ name, prompt: promptText, project_type: projectType, ai_model: aiModel }),
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

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!initialPrompt || processingPrompt || loading) return;
    setProcessingPrompt(true);
    void createProject(inferProjectName(initialPrompt), initialPrompt);
  }, [createProject, initialPrompt, loading, processingPrompt]);

  async function handlePromptSubmit(projectType: string) {
    const value = prompt.trim();
    if (!value) return;

    setGenerating(true);
    try {
      await createProject(inferProjectName(value), value, projectType);
    } finally {
      setGenerating(false);
      setPrompt("");
    }
  }

  function handleTemplateSelect(templatePrompt: string) {
    setPrompt(templatePrompt);
  }

  return (
    <div className="flex h-screen flex-col bg-[#0d0d0d]">
      {/* Persistent top bar */}
      <TopBar
        tabs={tabs}
        activeTabId=""
        onTabClick={(id) => router.push(`/project/${id}`)}
        onTabClose={(id) => {
          setProjects((prev) => prev.filter((p) => p.id !== id));
        }}
        onCloseOthers={() => {}}
        onCloseAll={() => setProjects([])}
        onRename={(id, newName) => {
          setProjects((prev) =>
            prev.map((p) => (p.id === id ? { ...p, name: newName } : p)),
          );
        }}
        onDelete={(id) => {
          setProjects((prev) => prev.filter((p) => p.id !== id));
        }}
        onNewProject={() => createProject("Untitled Project")}
      />

      {/* Main centered content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[640px] text-center"
        >
          {/* Workspace selector */}
          <button className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-1.5 text-[12px] text-[#999] transition hover:border-[#333]">
            <span className="h-2 w-2 rounded-full bg-sky-500" />
            {displayName}&apos;s Project
            <ChevronDown className="h-3 w-3" />
          </button>

          {/* Heading */}
          <h1 className="text-[36px] font-semibold leading-tight text-white">
            Where ideas become reality
          </h1>
          <p className="mt-2 text-[15px] text-[#999]">
            Build fully functional apps and websites through simple conversations
          </p>

          {/* Prompt input */}
          <div className="mt-8">
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              onSubmit={handlePromptSubmit}
              disabled={generating}
            />
          </div>

          {/* Templates */}
          <TemplateSuggestions onSelect={handleTemplateSelect} />
        </motion.div>
      </main>

    </div>
  );
}
