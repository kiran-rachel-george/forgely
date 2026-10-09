"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface StreamingCodeViewProps {
  /** The raw streamed text from the AI (grows over time) */
  code: string;
  /** Whether generation is still in progress */
  isGenerating: boolean;
}

/**
 * Displays real-time streaming code from the AI with auto-scroll
 * and a blinking cursor at the insertion point.
 */
export function StreamingCodeView({ code, isGenerating }: StreamingCodeViewProps) {
  const containerRef = useRef<HTMLPreElement>(null);

  // Auto-scroll to bottom as new code appears
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [code]);

  return (
    <div className="flex h-full flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[#2a2a2a] bg-[#111] px-4">
        {isGenerating ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
            <span className="text-[12px] font-medium text-sky-400">
              Generating code...
            </span>
          </div>
        ) : (
          <span className="text-[12px] text-[#666]">Generation complete</span>
        )}
      </div>

      {/* Streaming code display */}
      <pre
        ref={containerRef}
        className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[13px] leading-relaxed text-[#c8c8c8]"
      >
        {code || (
          <span className="text-[#555]">Waiting for AI response...</span>
        )}
        {isGenerating && (
          <span className="ml-0.5 inline-block h-[18px] w-[2px] animate-pulse bg-sky-400 align-middle" />
        )}
      </pre>
    </div>
  );
}
