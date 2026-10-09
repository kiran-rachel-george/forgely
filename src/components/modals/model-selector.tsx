"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const MODELS = [
  { id: "claude-sonnet", label: "Claude 4.5 Sonnet", icon: "🌸" },
  { id: "gpt-4.1", label: "GPT-4.1", icon: "🟢" },
  { id: "claude-opus", label: "Claude Opus", icon: "🔮" },
];

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = MODELS.find((m) => m.id === value) ?? MODELS[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-[#999] transition hover:bg-[#333] hover:text-white"
      >
        <span>{selected.icon}</span>
        <span>{selected.label}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-48 rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-1 shadow-xl">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                onChange(model.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[12px] transition ${
                model.id === value
                  ? "bg-sky-500/10 text-sky-400"
                  : "text-[#999] hover:bg-[#242424] hover:text-white"
              }`}
            >
              <span>{model.icon}</span>
              <span>{model.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
