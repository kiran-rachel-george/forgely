"use client";

import { useState } from "react";
import { X, AlertTriangle, Plus, Eye } from "lucide-react";

interface CreditBannerProps {
  credits: number;
  onBuyCredits: () => void;
}

export function CreditBanner({ credits, onBuyCredits }: CreditBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (credits > 0 || dismissed) return null;

  return (
    <div className="space-y-0">
      {/* Warning message in chat */}
      <div className="mx-4 mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="text-[13px] font-medium text-amber-300">
              You&apos;ve used all your credits
            </p>
            <p className="mt-1 text-[12px] text-amber-300/70">
              Purchase more credits to continue generating apps with AI.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={onBuyCredits}
                className="flex items-center gap-1 rounded-lg bg-sky-500 px-3 py-1.5 text-[11px] font-medium text-white transition hover:bg-sky-400"
              >
                <Plus className="h-3 w-3" /> Buy Credits
              </button>
              <button className="flex items-center gap-1 rounded-lg border border-[#333] px-3 py-1.5 text-[11px] font-medium text-[#999] transition hover:text-white">
                <Eye className="h-3 w-3" /> Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between border-t border-amber-500/20 bg-amber-500/5 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-amber-300/70">
            ⊕ You have exhausted all of your credits.
          </span>
          <button
            onClick={onBuyCredits}
            className="text-[12px] font-medium text-sky-400 transition hover:text-sky-300"
          >
            Buy Credits
          </button>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-[#555] transition hover:text-white"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
