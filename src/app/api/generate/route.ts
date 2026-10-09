import { NextRequest, NextResponse } from "next/server";

import { AI_SYSTEM_PROMPT, MAX_CONTEXT_MESSAGES } from "@/lib/constants";
import { deductCredit, ensureProfile, refundCredit } from "@/lib/credits";
import { streamChatCompletion } from "@/lib/openai";
import { ensureProjectOwnership, getNextVersionNumber, touchProject } from "@/lib/project-db";
import { acquireLock, checkRateLimit } from "@/lib/rate-limit";
import { getSupabaseServiceClient, getUserFromRequest } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 300;

const RATE_LIMIT_REQUESTS = 6;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_BODY_BYTES = 4_000_000;
const MAX_PROMPT_CHARS = 4_000;
const MAX_ATTEMPTS = 3;
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS) || 60000;
const STREAM_RESET_MARKER = "\n___STREAM_RESET___\n";

type ChatMessage = { role: string; content: string };

type ContextMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  const limit = checkRateLimit(`generate:${user.id}`, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${limit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const previousFiles =
    typeof body.previousFiles === "object" && body.previousFiles
      ? (body.previousFiles as Record<string, string>)
      : null;
  const rawMessages = Array.isArray((body as { messages?: unknown }).messages)
    ? ((body as { messages: unknown[] }).messages ?? [])
    : [];

  const history: ContextMessage[] = rawMessages
    .filter(
      (
        message: unknown,
      ): message is {
        role?: unknown;
        content: string;
      } =>
        Boolean(message) &&
        typeof message === "object" &&
        message !== null &&
        "content" in message &&
        typeof (message as { content?: unknown }).content === "string",
    )
    .map((message): ContextMessage => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: String(message.content),
    }));

  if (!projectId || !prompt) {
    return NextResponse.json(
      { error: "projectId and prompt are required" },
      { status: 400 },
    );
  }

  if (prompt.length > MAX_PROMPT_CHARS) {
    return NextResponse.json(
      { error: `Prompt is too long (max ${MAX_PROMPT_CHARS} characters).` },
      { status: 400 },
    );
  }

  const project = await ensureProjectOwnership(projectId, user.id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // One generation at a time per user.
  const releaseLock = acquireLock(`generate:${user.id}`);
  if (!releaseLock) {
    return NextResponse.json(
      { error: "A generation is already running. Wait for it to finish." },
      { status: 429 },
    );
  }

  // Take the credit up front; it is refunded below if nothing gets saved.
  let credits: { ok: boolean; remaining: number };
  try {
    await ensureProfile(user);
    credits = await deductCredit(user.id);
  } catch (error) {
    releaseLock();
    const message = error instanceof Error ? error.message : "Could not check credits";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!credits.ok) {
    releaseLock();
    return NextResponse.json({ error: "You have no credits left.", credits: 0 }, { status: 402 });
  }

  let saved = false;

  const db = getSupabaseServiceClient();

  let userContent = prompt;
  if (previousFiles) {
    // Only send src/ files as context to keep token usage low
    const srcFiles = Object.entries(previousFiles).filter(
      ([path]) => path.startsWith("src/"),
    );
    if (srcFiles.length > 0) {
      const fileList = srcFiles
        .map(([path, content]) => `--- ${path} ---\n${content}`)
        .join("\n\n");
      userContent = `Current src/ files:\n${fileList}\n\nUser request:\n${prompt}`;
    }
  }

  const contextMessages: ChatMessage[] = history
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  const messages: ChatMessage[] = [
    { role: "system" as const, content: AI_SYSTEM_PROMPT },
    ...contextMessages,
    { role: "user" as const, content: userContent },
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      void (async () => {
        try {
          let generatedCode = "";
          let lastFailure = "";

          for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            if (attempt > 1) {
              // Tell the client to discard the partial output of the failed attempt.
              controller.enqueue(encoder.encode(STREAM_RESET_MARKER));
            }

            generatedCode = "";
            let finishReason: string | null = null;

            try {
              for await (const event of streamChatCompletion({
                messages,
                maxTokens: MAX_OUTPUT_TOKENS,
              })) {
                if (event.finishReason) finishReason = event.finishReason;
                if (!event.token) continue;

                generatedCode += event.token;
                controller.enqueue(encoder.encode(event.token));
              }
            } catch (error) {
              lastFailure = error instanceof Error ? error.message : "Generation failed";
              console.error(`[generate] Attempt ${attempt}/${MAX_ATTEMPTS} errored:`, error);
              continue;
            }

            // A cut-off response yields half-written files that break the preview.
            const openFiles = (generatedCode.match(/<<<FILE:/g) ?? []).length;
            const closedFiles = (generatedCode.match(/<<<END_FILE>>>/g) ?? []).length;
            if (finishReason !== "length" && openFiles > 0 && openFiles === closedFiles) {
              lastFailure = "";
              break;
            }

            lastFailure = "The AI response was cut off before the app finished.";
            console.error(
              `[generate] Attempt ${attempt}/${MAX_ATTEMPTS} incomplete: finish_reason=${finishReason} files=${openFiles} closed=${closedFiles} chars=${generatedCode.length}`,
            );
          }

          if (lastFailure) {
            throw new Error(`${lastFailure} Nothing was saved. Please try again.`);
          }

          // Clean markdown fences if present
          let cleaned = generatedCode.trim();
          if (cleaned.startsWith("```")) {
            cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
          }

          // Save to DB
          const nextVersion = await getNextVersionNumber(projectId);

          const { error: versionError } = await db.from("versions").insert({
            project_id: projectId,
            code: cleaned,
            prompt,
            version_number: nextVersion,
          });

          if (versionError) {
            throw new Error(`Could not save the generated app: ${versionError.message}`);
          }
          saved = true;

          const { error: messageError } = await db.from("messages").insert([
            { project_id: projectId, role: "user", content: prompt },
            { project_id: projectId, role: "assistant", content: cleaned },
          ]);

          if (messageError) {
            console.error("[generate] Could not save chat messages:", messageError.message);
          }

          await touchProject(projectId);
          controller.close();
        } catch (error) {
          console.error("[generate] Stream error:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Generation failed";
          // Signal error to the client in a parseable way
          const errorPayload = JSON.stringify({ error: errorMessage });
          controller.enqueue(encoder.encode(`\n___STREAM_ERROR___${errorPayload}`));
          controller.close();
        } finally {
          if (!saved) {
            await refundCredit(user.id).catch((refundError) =>
              console.error("[generate] Refund failed:", refundError),
            );
          }
          releaseLock();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Credits-Remaining": String(credits.remaining),
    },
  });
}
