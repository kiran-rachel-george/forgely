"use client";

import { useCallback, useState } from "react";

import { getAccessToken } from "@/lib/api-client";
import type { Message } from "@/lib/types";

interface GenerateOptions {
  projectId: string;
  prompt: string;
  previousFiles: Record<string, string>;
  messages: Message[];
  onStreamChunk: (text: string) => void;
  onComplete: (responseText: string, prompt: string) => Promise<void> | void;
}

export function useChat() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedCode, setStreamedCode] = useState<string>("");

  const generate = useCallback(async (options: GenerateOptions) => {
    setIsGenerating(true);
    setStreamedCode("");

    const token = await getAccessToken();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId: options.projectId,
          prompt: options.prompt,
          previousFiles: options.previousFiles,
          messages: options.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        let message = "Failed to generate code";

        try {
          const payload = await response.json();
          if (payload?.error) {
            message = payload.error;
          }
        } catch {
          // ignore
        }

        throw new Error(message);
      }

      if (!response.body) {
        throw new Error("Streaming not supported in this environment.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullText = "";

      while (!done) {
        const result = await reader.read();
        done = result.done;

        if (result.value) {
          const chunk = decoder.decode(result.value, { stream: true });
          fullText += chunk;

          // The server restarts generation after a cut-off response: drop the partial text.
          const resetMarker = "\n___STREAM_RESET___\n";
          const resetIdx = fullText.lastIndexOf(resetMarker);
          if (resetIdx !== -1) {
            fullText = fullText.slice(resetIdx + resetMarker.length);
          }
          setStreamedCode(fullText);
          options.onStreamChunk(fullText);
        }
      }

      const trimmed = fullText.trim();

      // Check if the stream ended with a server-side error marker
      const errorMarker = "___STREAM_ERROR___";
      if (trimmed.includes(errorMarker)) {
        const errorJson = trimmed.split(errorMarker).pop() ?? "";
        let errorMessage = "Generation failed on the server";
        try {
          const parsed = JSON.parse(errorJson);
          if (parsed.error) errorMessage = parsed.error;
        } catch {
          // Use default message
        }
        throw new Error(errorMessage);
      }

      await options.onComplete(trimmed, options.prompt);
      return trimmed;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    streamedCode,
    generate,
  };
}
