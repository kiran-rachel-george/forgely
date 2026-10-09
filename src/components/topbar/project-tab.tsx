"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TabInfo {
  id: string;
  name: string;
  active: boolean;
}

interface ProjectTabProps {
  tab: TabInfo;
  onClick: () => void;
  onClose: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export function ProjectTab({ tab, onClick, onClose, onContextMenu }: ProjectTabProps) {
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={cn(
        "group flex h-full shrink-0 cursor-pointer items-center gap-2 border-r border-[#2a2a2a] px-3 text-[12px] transition min-w-[140px] max-w-[200px]",
        tab.active
          ? "bg-[#242424] text-white"
          : "bg-[#1a1a1a] text-[#666] hover:text-[#999] hover:bg-[#1f1f1f]",
      )}
    >
      {/* Status dot */}
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          tab.active ? "bg-emerald-400" : "bg-[#555]",
        )}
      />

      {/* Project name — truncated */}
      <span className="truncate flex-1">{tab.name}</span>

      {/* Close button — visible on hover or when active */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={cn(
          "flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[#555] transition-opacity hover:bg-[#3a3a3a] hover:text-white",
          tab.active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
