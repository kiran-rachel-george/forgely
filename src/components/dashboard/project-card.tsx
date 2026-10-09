"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Trash2, MoreHorizontal } from "lucide-react";

import type { Project } from "@/lib/types";
import { shorten } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  onDelete: (projectId: string) => Promise<void>;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [busy, setBusy] = useState(false);

  const snippet = useMemo(() => {
    return project.latest_prompt || project.latest_code || "";
  }, [project.latest_code, project.latest_prompt]);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    try {
      await onDelete(project.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Link href={`/project/${project.id}`} className="group block">
      <div className="overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#1c1c1c] transition-all hover:border-[#333] hover:shadow-lg hover:shadow-sky-500/5">
        {/* Thumbnail */}
        <div className="relative h-[120px] bg-gradient-to-br from-sky-500/10 via-[#1c1c1c] to-teal-500/10 p-3">
          <p className="line-clamp-4 font-mono text-[11px] leading-relaxed text-[#555]">
            {shorten(snippet, 160)}
          </p>
          {/* Actions overlay */}
          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              onClick={handleDelete}
              disabled={busy}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0a0a0a]/80 text-[#666] transition hover:bg-red-500/20 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </button>
            <button className="flex h-6 w-6 items-center justify-center rounded-md bg-[#0a0a0a]/80 text-[#666] transition hover:bg-[#333] hover:text-white">
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </div>
        </div>
        {/* Info */}
        <div className="border-t border-[#2a2a2a] px-3 py-2.5">
          <p className="truncate text-[13px] font-medium text-white">{project.name}</p>
          <p className="mt-0.5 text-[11px] text-[#666]">
            v{project.latest_version_number ?? 1}
          </p>
        </div>
      </div>
    </Link>
  );
}
