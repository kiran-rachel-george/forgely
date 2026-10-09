import { UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
}

export function Avatar({ src, alt, fallback, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? "Avatar"} className="size-full object-cover" />
      ) : fallback ? (
        <span className="text-xs font-semibold text-slate-300">{fallback.slice(0, 2).toUpperCase()}</span>
      ) : (
        <UserRound className="size-4 text-slate-400" />
      )}
    </div>
  );
}
