"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WebContainer, WebContainerProcess } from "@webcontainer/api";

export function useDevServer(instance: WebContainer | null) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  const [starting, setStarting] = useState(false);
  const [ready, setReady] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const devProcessRef = useRef<WebContainerProcess | null>(null);

  const appendLog = useCallback((line: string) => {
    setLogs((prev) => [...prev.slice(-200), line]);
  }, []);

  const startDevServer = useCallback(async () => {
    if (!instance) return;

    try {
      // Install
      setInstalling(true);
      appendLog("$ npm install");
      const installProcess = await instance.spawn("npm", ["install"]);

      installProcess.output.pipeTo(
        new WritableStream({
          write(chunk) {
            appendLog(chunk);
          },
        }),
      ).catch((pipeError) => {
        console.warn("[useDevServer] install output pipe error:", pipeError);
      });

      const installExitCode = await installProcess.exit;
      setInstalling(false);

      if (installExitCode !== 0) {
        appendLog(`npm install failed with exit code ${installExitCode}`);
        return;
      }

      appendLog("$ npm run dev");
      setStarting(true);

      const devProcess = await instance.spawn("npm", ["run", "dev"]);
      devProcessRef.current = devProcess;

      devProcess.output.pipeTo(
        new WritableStream({
          write(chunk) {
            appendLog(chunk);
          },
        }),
      ).catch((pipeError) => {
        console.warn("[useDevServer] dev output pipe error:", pipeError);
      });

      // Listen for server-ready
      instance.on("server-ready", (_port, url) => {
        setPreviewUrl(url);
        setStarting(false);
        setReady(true);
        appendLog(`Dev server ready at ${url}`);
      });
    } catch (startError) {
      console.error("[useDevServer] Failed to start dev server:", startError);
      setInstalling(false);
      setStarting(false);
      appendLog(`Error: ${startError instanceof Error ? startError.message : String(startError)}`);
    }
  }, [instance, appendLog]);

  const stopDevServer = useCallback(() => {
    if (devProcessRef.current) {
      devProcessRef.current.kill();
      devProcessRef.current = null;
    }
    setPreviewUrl(null);
    setReady(false);
    setStarting(false);
  }, []);

  return {
    previewUrl,
    installing,
    starting,
    ready,
    logs,
    startDevServer,
    stopDevServer,
    appendLog,
  };
}
