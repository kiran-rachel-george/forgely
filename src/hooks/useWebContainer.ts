"use client";

import { useEffect, useRef, useState } from "react";
import type { WebContainer } from "@webcontainer/api";

/**
 * Singleton hook — boots one WebContainer per page and reuses it.
 * Pre-checks for SharedArrayBuffer + valid origin before attempting boot.
 * Exposes `isFallback` so the rest of the app can switch to Sandpack preview.
 */
export function useWebContainer() {
  const [instance, setInstance] = useState<WebContainer | null>(null);
  const [booting, setBooting] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bootAttempted = useRef(false);

  useEffect(() => {
    if (bootAttempted.current) return;
    bootAttempted.current = true;

    async function boot() {
      try {
        // Check valid origin (localhost or HTTPS)
        const isValidOrigin =
          typeof window !== "undefined" &&
          (location.hostname === "localhost" ||
            location.hostname === "127.0.0.1" ||
            location.protocol === "https:");

        if (!isValidOrigin) {
          console.warn(
            "WebContainer requires localhost or HTTPS. Using Sandpack fallback.",
          );
          setIsFallback(true);
          setBooting(false);
          return;
        }

        // Check for SharedArrayBuffer (requires COEP/COOP headers)
        if (typeof SharedArrayBuffer === "undefined") {
          console.warn(
            "SharedArrayBuffer not available (missing COEP/COOP headers). Using Sandpack fallback.",
          );
          setIsFallback(true);
          setBooting(false);
          return;
        }

        // Dynamic import to avoid SSR issues
        const { WebContainer } = await import("@webcontainer/api");
        const wc = await WebContainer.boot();
        setInstance(wc);

        wc.on("server-ready", (_port: number, url: string) => {
          console.log(`[webcontainer] server-ready on port ${_port}: ${url}`);
          // Give Vite a moment to finish initial compilation
          setTimeout(() => {
            setServerUrl(url);
          }, 2000);
        });

        wc.on("error", (err: { message: string }) => {
          console.error("WebContainer runtime error:", err);
          setError(err.message);
          setIsFallback(true);
        });
      } catch (err) {
        console.error("WebContainer boot failed:", err);
        setError(err instanceof Error ? err.message : String(err));
        setIsFallback(true);
      } finally {
        setBooting(false);
      }
    }

    boot();
  }, []);

  return { instance, booting, isFallback, serverUrl, error };
}
