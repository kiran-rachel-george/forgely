"use client";

import { useState } from "react";
import { Terminal as TerminalIcon, ChevronDown, ChevronUp } from "lucide-react";
import type { WebContainer } from "@webcontainer/api";

import { useTerminal } from "@/hooks/useTerminal";
import { cn } from "@/lib/utils";

interface TerminalPanelProps {
  instance: WebContainer | null;
  isOpen: boolean;
  onToggle: () => void;
}

export function TerminalPanel({ instance, isOpen, onToggle }: TerminalPanelProps) {
  const [terminalEl, setTerminalEl] = useState<HTMLDivElement | null>(null);
  useTerminal(instance, isOpen ? terminalEl : null);

  return (
    <div
      className={cn(
        "flex flex-col border-t border-[#2a2a2a] bg-[#0d0d0d] transition-all",
        isOpen ? "h-[200px]" : "h-8",
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="flex h-8 shrink-0 items-center gap-2 border-b border-[#2a2a2a] px-3 transition hover:bg-[#1a1a1a]"
      >
        <TerminalIcon className="h-3.5 w-3.5 text-[#666]" />
        <span className="text-[11px] font-medium text-[#a1a1a1]">Terminal</span>
        {isOpen ? (
          <ChevronDown className="ml-auto h-3 w-3 text-[#555]" />
        ) : (
          <ChevronUp className="ml-auto h-3 w-3 text-[#555]" />
        )}
      </button>

      {/* Terminal container */}
      {isOpen && <div ref={setTerminalEl} className="min-h-0 flex-1 p-1" />}
    </div>
  );
}
