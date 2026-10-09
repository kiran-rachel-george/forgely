/**
 * Per-user limits for expensive endpoints: a sliding-window request cap and a
 * one-at-a-time lock. State lives in this server process, so on a multi-instance
 * deployment swap it for a shared store (Redis / Upstash).
 */
const requestLog = new Map<string, number[]>();
const running = new Set<string>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter((time) => now - time < windowMs);

  if (recent.length >= limit) {
    const retryAfterSeconds = Math.ceil((recent[0] + windowMs - now) / 1000);
    requestLog.set(key, recent);
    return { ok: false, retryAfterSeconds };
  }

  recent.push(now);
  requestLog.set(key, recent);
  return { ok: true };
}

/** Returns a release function, or null if this key already has a run in flight. */
export function acquireLock(key: string): (() => void) | null {
  if (running.has(key)) return null;
  running.add(key);
  return () => {
    running.delete(key);
  };
}
