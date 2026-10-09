"use client";

import { Laptop, Smartphone, Tablet, Maximize2, RotateCw, Loader2, Share2, Rocket, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type PreviewMode = "desktop" | "tablet" | "mobile";

interface PreviewProps {
  srcDoc: string;
  mode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  isGenerating?: boolean;
  onDeploy?: () => void;
}

const widths: Record<PreviewMode, string> = {
  desktop: "w-full",
  tablet: "w-[820px] max-w-full",
  mobile: "w-[390px] max-w-full",
};

export function Preview({ srcDoc, mode, onModeChange, isGenerating, onDeploy }: PreviewProps) {
  const hasContent = srcDoc && srcDoc.trim().length > 0;

  return (
    <div className="flex h-full flex-col bg-[#111]">
      {/* Preview header bar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[#2a2a2a] px-3">
        {/* Left: Title + device toggles */}
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-medium text-white">App Preview</span>
          <div className="flex items-center gap-0.5 rounded-lg border border-[#2a2a2a] bg-[#1c1c1c] p-0.5">
            <button
              className={cn(
                "rounded-md px-2 py-1 text-[#555] transition",
                mode === "desktop" && "bg-[#2a2a2a] text-white",
              )}
              onClick={() => onModeChange("desktop")}
              title="Desktop"
            >
              <Laptop className="h-3.5 w-3.5" />
            </button>
            <button
              className={cn(
                "rounded-md px-2 py-1 text-[#555] transition",
                mode === "tablet" && "bg-[#2a2a2a] text-white",
              )}
              onClick={() => onModeChange("tablet")}
              title="Tablet"
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              className={cn(
                "rounded-md px-2 py-1 text-[#555] transition",
                mode === "mobile" && "bg-[#2a2a2a] text-white",
              )}
              onClick={() => onModeChange("mobile")}
              title="Mobile"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#555] transition hover:bg-[#222] hover:text-white"
            title="Expand"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#555] transition hover:bg-[#222] hover:text-white"
            title="Refresh"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
          <button className="flex items-center gap-1 rounded-lg border border-[#333] px-2.5 py-1 text-[11px] text-[#999] transition hover:text-white">
            <Share2 className="h-3 w-3" />
            Share
          </button>
          <button
            onClick={onDeploy}
            className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-emerald-400"
          >
            <Rocket className="h-3 w-3" />
            Deploy
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-[#555] transition hover:bg-[#222] hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div className="relative flex-1 overflow-hidden">
        {isGenerating && !hasContent ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
            <p className="text-[14px] font-medium text-white">Getting ready...</p>
            <p className="text-[12px] text-[#555]">Generating your component</p>
          </div>
        ) : !hasContent ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2a2a2a] bg-[#1c1c1c]">
              <Laptop className="h-6 w-6 text-[#555]" />
            </div>
            <p className="text-[14px] text-[#a1a1a1]">No preview yet</p>
            <p className="text-[12px] text-[#555]">Start a conversation to generate a component</p>
          </div>
        ) : (
          <div className="flex h-full items-start justify-center overflow-auto bg-[#0a0a0a] p-2">
            <iframe
              title="Live preview"
              srcDoc={srcDoc}
              sandbox="allow-scripts"
              className={cn(
                "h-full min-h-[480px] rounded-lg bg-white transition-all",
                widths[mode],
              )}
            />
            {isGenerating && (
              <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-[#1c1c1c]/90 px-3 py-1.5 backdrop-blur">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
                <span className="text-[11px] text-[#a1a1a1]">Updating...</span>
              </div>
            )}
          </div>
        )}

        {/* Watermark */}
        {hasContent && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-[#1a1a1a]/80 px-2.5 py-1 text-[10px] text-[#555] backdrop-blur">
            ✏ Made with Forgely
          </div>
        )}
      </div>
    </div>
  );
}
