"use client";

import { useState } from "react";
import {
  Send,
  Mic,
  Paperclip,
  Github,
  Globe,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ProjectType = "fullstack" | "mobile" | "landing";

const TYPE_TABS: { type: ProjectType; icon: string; label: string }[] = [
  { type: "fullstack", icon: "🔷", label: "Full Stack App" },
  { type: "mobile", icon: "📱", label: "Mobile App" },
  { type: "landing", icon: "🖥", label: "Landing Page" },
];

const PLACEHOLDERS: Record<ProjectType, string> = {
  fullstack: "Build me a SaaS app for...",
  mobile: "Build me a mobile app that...",
  landing: "Create a landing page for...",
};

interface PromptInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (projectType: ProjectType) => void;
  disabled?: boolean;
}

export function PromptInput({ value, onChange, onSubmit, disabled }: PromptInputProps) {
  const [projectType, setProjectType] = useState<ProjectType>("fullstack");
  const [isPublic, setIsPublic] = useState(false);

  return (
    <div className="w-full">
      {/* Type tabs */}
      <div className="mb-3 flex items-center justify-center gap-1">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setProjectType(tab.type)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition",
              projectType === tab.type
                ? "bg-[#242424] text-white"
                : "text-[#666] hover:text-[#999]",
            )}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Input box */}
      <div className="rounded-2xl border border-[#2a2a2a] bg-[#242424] p-4 shadow-2xl">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(projectType);
            }
          }}
          placeholder={PLACEHOLDERS[projectType]}
          className="w-full bg-transparent text-[15px] text-white placeholder:text-[#555] focus:outline-none"
          disabled={disabled}
        />

        {/* Bottom toolbar */}
        <div className="mt-3 flex items-center gap-1">
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[#555] transition hover:bg-[#333] hover:text-white">
            <Paperclip className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[#555] transition hover:bg-[#333] hover:text-white">
            <Github className="h-3.5 w-3.5" />
          </button>
          <div className="flex-1" />

          <button
            onClick={() => setIsPublic(!isPublic)}
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] transition",
              isPublic ? "text-emerald-400" : "text-[#555] hover:text-[#999]",
            )}
          >
            <Globe className="h-3.5 w-3.5" />
            {isPublic ? "Public" : "Private"}
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[#555] transition hover:bg-[#333] hover:text-white">
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-[#555] transition hover:bg-[#333] hover:text-white">
            <Mic className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onSubmit(projectType)}
            disabled={disabled || !value.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white transition hover:bg-sky-400 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
