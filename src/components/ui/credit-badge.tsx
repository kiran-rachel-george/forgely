import { Coins } from "lucide-react";

import { cn } from "@/lib/utils";

interface CreditBadgeProps {
  credits: number | null;
  className?: string;
}

export function CreditBadge({ credits, className }: CreditBadgeProps) {
  if (credits === null) return null;

  const tone =
    credits === 0
      ? "border-red-500/40 bg-red-500/10 text-red-300"
      : credits <= 2
        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
        : "border-[#2a2a2a] bg-[#1a1a1a] text-[#a1a1a1]";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        tone,
        className,
      )}
      title="Each generation uses 1 credit"
    >
      <Coins className="h-3 w-3" />
      {credits} {credits === 1 ? "credit" : "credits"}
    </span>
  );
}
