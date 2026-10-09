import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function shorten(input: string, length = 120) {
  return input.length > length ? `${input.slice(0, length)}...` : input;
}

/** Derive a project name from a user prompt. */
export function inferProjectName(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return "Untitled Project";
  const capped = trimmed.length > 50 ? `${trimmed.slice(0, 50)}…` : trimmed;
  return capped.charAt(0).toUpperCase() + capped.slice(1);
}

export function stripCodeFences(value: string) {
  return value
    .replace(/^```(?:tsx|jsx|ts|js)?\n?/i, "")
    .replace(/\n?```$/i, "")
    .trim();
}

export function sanitizeComponentCode(source: string) {
  return stripCodeFences(source).replace(/\u0000/g, "");
}
