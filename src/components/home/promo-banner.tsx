"use client";

import { useState } from "react";
import { X, Sparkles } from "lucide-react";

export function PromoBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-sky-600/90 via-cyan-500/90 to-teal-500/90 px-4 py-2.5">
      <span className="text-[13px] font-medium text-white">
        🎉 Launch Special — 50% off Pro plan
      </span>
      <button className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-[11px] font-medium text-white backdrop-blur transition hover:bg-white/30">
        Auto applied <Sparkles className="h-3 w-3" />
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/60 transition hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
