import { cn } from "@/lib/utils";

interface SeparatorProps {
  className?: string;
  vertical?: boolean;
}

export function Separator({ className, vertical = false }: SeparatorProps) {
  return (
    <div
      className={cn(
        vertical ? "h-full w-px" : "h-px w-full",
        "bg-slate-800",
        className,
      )}
    />
  );
}
