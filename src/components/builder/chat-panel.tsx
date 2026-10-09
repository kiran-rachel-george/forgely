"use client";

import { useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Square,
  CheckCircle2,
  Circle,
  CircleDot,
} from "lucide-react";

import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface PlanStep {
  text: string;
  status: "pending" | "in-progress" | "done";
}

interface ChatPanelProps {
  messages: Message[];
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  streamingText: string;
  plan: PlanStep[];
}

const SUGGESTION_CHIPS = [
  "Add dark mode toggle",
  "Add persistent storage",
  "Improve the UI design",
  "Add animations",
];

export function ChatPanel({
  messages,
  prompt,
  onPromptChange,
  onSubmit,
  isGenerating,
  streamingText,
  plan,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating, streamingText, plan]);

  const displayMessages = messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {displayMessages.length === 0 && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2a2a2a] bg-[#1c1c1c]">
              <Send className="h-5 w-5 text-[#666]" />
            </div>
            <p className="text-[14px] text-[#a1a1a1]">
              Describe what you want to build
            </p>
            <p className="mt-1 text-[12px] text-[#555]">
              The AI will generate a frontend-only React app in the Vite scaffold.
            </p>
          </div>
        )}

        {displayMessages.map((message, idx) => {
          const isUser = message.role === "user";
          const isAssistant = message.role === "assistant";
          const isLastAssistant =
            isAssistant && idx === displayMessages.length - 1;

          // Try to parse assistant content as JSON for description + plan
          let description = "";
          let msgPlan: string[] = [];
          if (isAssistant) {
            try {
              const parsed = JSON.parse(message.content);
              description = parsed.description || "";
              msgPlan = Array.isArray(parsed.plan) ? parsed.plan : [];
            } catch {
              // Not JSON — display raw content or a summary for long responses
              description =
                message.content.length > 300
                  ? "App generated successfully."
                  : message.content;
            }
          }

          return (
            <div key={message.id} className="mb-4">
              {isUser && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#2a2a2a] px-4 py-2.5">
                    <p className="text-[13px] leading-relaxed text-white">
                      {message.content}
                    </p>
                  </div>
                </div>
              )}

              {isAssistant && (
                <div className="mt-2">
                  <p className="text-[13px] leading-relaxed text-[#a1a1a1]">
                    {description}
                  </p>

                  {/* Plan steps from stored message */}
                  {msgPlan.length > 0 && (
                    <div className="mt-2 space-y-1.5 rounded-xl border border-[#2a2a2a] bg-[#1c1c1c] p-3">
                      {msgPlan.map((step: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span className="text-[12px] text-[#888]">
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggestion chips after last assistant */}
                  {isLastAssistant && !isGenerating && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {SUGGESTION_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => {
                            onPromptChange(chip);
                            onSubmit();
                          }}
                          className="rounded-full border border-[#2a2a2a] bg-[#1c1c1c] px-3 py-1.5 text-[11px] text-[#a1a1a1] transition hover:border-[#333] hover:text-white"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Live plan view during generation */}
        {plan.length > 0 && (
          <div className="mb-4 mt-2 space-y-1.5 rounded-xl border border-[#2a2a2a] bg-[#1c1c1c] p-3">
            {plan.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                {step.status === "done" && (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                )}
                {step.status === "in-progress" && (
                  <CircleDot className="h-3.5 w-3.5 shrink-0 animate-pulse text-sky-400" />
                )}
                {step.status === "pending" && (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-[#444]" />
                )}
                <span
                  className={cn(
                    "text-[12px]",
                    step.status === "done"
                      ? "text-[#888]"
                      : step.status === "in-progress"
                        ? "text-sky-300"
                        : "text-[#555]",
                  )}
                >
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Generating indicator (before plan is parsed) */}
        {isGenerating && plan.length === 0 && (
          <div className="mb-4 mt-2">
            <div className="flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
              <p className="text-[13px] text-[#a1a1a1]">
                {streamingText.length > 100
                  ? "Building your app..."
                  : "Analyzing requirements..."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[#2a2a2a] p-3">
        <div className="rounded-2xl border border-[#2a2a2a] bg-[#1c1c1c] px-3 py-2.5">
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={
              isGenerating ? "Generating..." : "Describe your frontend page/app..."
            }
            className="w-full resize-none bg-transparent text-[13px] text-white placeholder:text-[#555] focus:outline-none"
            rows={2}
            disabled={isGenerating}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
          />
          <div className="mt-2 flex items-center justify-end">
            {isGenerating ? (
              <button className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/20 text-red-400 transition hover:bg-red-500/30">
                <Square className="h-3 w-3" />
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={!prompt.trim()}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-white transition hover:bg-sky-400 disabled:opacity-30"
              >
                <Send className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
