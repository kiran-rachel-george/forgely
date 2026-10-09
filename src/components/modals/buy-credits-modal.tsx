"use client";

import { useState } from "react";
import { X } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    credits: 50,
    price: "$9",
    description: "Perfect for hobby projects",
    popular: false,
  },
  {
    name: "Pro",
    credits: 200,
    price: "$29",
    description: "For serious builders",
    popular: true,
  },
  {
    name: "Unlimited",
    credits: 999,
    price: "$79",
    description: "No limits, build everything",
    popular: false,
  },
];

interface BuyCreditsModalProps {
  open: boolean;
  onClose: () => void;
  currentCredits: number;
}

export function BuyCreditsModal({ open, onClose, currentCredits }: BuyCreditsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#555] transition hover:bg-[#333] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-[18px] font-semibold text-white">Buy Credits</h2>
        <p className="mt-1 text-[13px] text-[#999]">
          You have <span className="font-medium text-white">{currentCredits}</span> credits remaining
        </p>

        <div className="mt-5 grid gap-3">
          {PLANS.map((plan) => (
            <button
              key={plan.name}
              className={`relative flex items-center justify-between rounded-xl border p-4 text-left transition ${
                plan.popular
                  ? "border-sky-500/50 bg-sky-500/5 hover:bg-sky-500/10"
                  : "border-[#2a2a2a] bg-[#242424] hover:border-[#333]"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-white">{plan.name}</span>
                  {plan.popular && (
                    <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-medium text-sky-400">
                      Popular
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] text-[#999]">{plan.description}</p>
              </div>
              <div className="text-right">
                <span className="text-[18px] font-semibold text-white">{plan.price}</span>
                <p className="text-[11px] text-[#666]">{plan.credits} credits</p>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-4 text-center text-[11px] text-[#555]">
          Credits never expire. One-time purchase.
        </p>
      </div>
    </div>
  );
}
