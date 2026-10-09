"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Rocket } from "lucide-react";
import { toast } from "sonner";

import { ExamplesCarousel } from "@/components/landing/examples-carousel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { HERO_EXAMPLES } from "@/lib/constants";
import { apiFetch } from "@/lib/api-client";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { inferProjectName } from "@/lib/utils";
import type { Project } from "@/lib/types";

export function Hero() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isDisabled = useMemo(() => loading || !prompt.trim(), [loading, prompt]);

  async function handleGenerate() {
    const normalizedPrompt = prompt.trim();

    if (!normalizedPrompt) {
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const query = new URLSearchParams({
          prompt: normalizedPrompt,
          next: "/dashboard",
        });
        router.push(`/signup?${query.toString()}`);
        return;
      }

      await apiFetch<{ user: unknown }>("/api/profile/sync", { method: "POST" });

      const payload = await apiFetch<{ project: Project }>("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          name: inferProjectName(normalizedPrompt),
          prompt: normalizedPrompt,
        }),
      });

      const query = new URLSearchParams({ autoPrompt: normalizedPrompt });
      router.push(`/project/${payload.project.id}?${query.toString()}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create project";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-cyan-200">
            AI-powered app generation
          </div>
          <h1 className="text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl lg:text-6xl">
            Describe your app. <br className="hidden sm:block" /> Watch it come to life.
          </h1>
          <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
            Build production-style React apps from plain English prompts, iterate with follow-ups, edit code manually, and preview instantly.
          </p>
          <ExamplesCarousel examples={HERO_EXAMPLES} onSelect={setPrompt} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl border border-slate-800 bg-slate-900/75 p-5 shadow-2xl shadow-cyan-900/20"
        >
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="build me a todo app with filters and drag-and-drop..."
            className="min-h-[220px] resize-none border-slate-700 bg-slate-950/80 text-base"
          />
          <Button
            className="mt-4 h-12 w-full text-base"
            disabled={isDisabled}
            onClick={handleGenerate}
          >
            <Rocket className="mr-2 size-4" />
            {loading ? "Generating..." : "Generate App"}
          </Button>
          <p className="mt-3 text-xs text-slate-500">
            Try prompts like: Build a todo app, Create a blog, Make a chat app.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
