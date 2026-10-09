import OpenAI from "openai";

let openai: OpenAI | null = null;

export function getOpenAIClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    });
  }

  return openai;
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gemini-3.6-flash";

export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";

export type CompletionEvent = { token?: string; finishReason?: string };

/**
 * Streams a chat completion straight from the Gemini OpenAI-compatible endpoint.
 * The `openai` SDK's stream parser ends Gemini streams early and drops finish_reason,
 * so the SSE stream is read and parsed here instead.
 */
export async function* streamChatCompletion(params: {
  messages: { role: string; content: string }[];
  maxTokens: number;
}): AsyncGenerator<CompletionEvent> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const response = await fetch(`${GEMINI_BASE_URL}chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      stream: true,
      temperature: 0.3,
      max_tokens: params.maxTokens,
      reasoning_effort: "low",
      messages: params.messages,
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Model request failed (${response.status}) ${detail.slice(0, 200)}`.trim());
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const parseLine = (line: string): CompletionEvent | null => {
    if (!line.startsWith("data:")) return null;
    const data = line.slice(5).trim();
    if (!data || data === "[DONE]") return null;

    try {
      const json = JSON.parse(data);
      if (json.error) {
        throw new Error(json.error.message ?? "Model returned an error");
      }
      const choice = json.choices?.[0];
      const event: CompletionEvent = {};
      if (choice?.delta?.content) event.token = choice.delta.content;
      if (choice?.finish_reason) event.finishReason = choice.finish_reason;
      return event.token || event.finishReason ? event : null;
    } catch (error) {
      if (error instanceof SyntaxError) return null;
      throw error;
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const event = parseLine(line.trim());
      if (event) yield event;
    }
  }

  const last = parseLine(buffer.trim());
  if (last) yield last;
}
