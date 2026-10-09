/** WebContainer mount tree node — either a file or a directory. */
type FileNode = { file: { contents: string } };
type DirectoryNode = { directory: Record<string, FileNode | DirectoryNode> };
export type WebContainerFileTree = Record<string, FileNode | DirectoryNode>;

/** Parsed AI response shape. */
export interface ParsedAIResponse {
  plan: string[];
  files: Record<string, string>;
  description: string;
  dependencies: Record<string, string>;
}

/**
 * Convert flat file map { "src/App.tsx": "code..." }
 * into WebContainer nested mount format.
 */
export function convertToWebContainerFiles(
  flatFiles: Record<string, string>,
): WebContainerFileTree {
  const mountTree: WebContainerFileTree = {};

  for (const [filePath, contents] of Object.entries(flatFiles)) {
    const segments = filePath.split("/");
    let currentDir: Record<string, FileNode | DirectoryNode> = mountTree;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (i === segments.length - 1) {
        currentDir[segment] = { file: { contents } };
      } else {
        if (!currentDir[segment]) {
          currentDir[segment] = { directory: {} };
        }
        currentDir = (currentDir[segment] as DirectoryNode).directory;
      }
    }
  }

  return mountTree;
}

/**
 * Parse the AI's response into files/plan/description/dependencies.
 * Supports the current plain-text delimited format (no escaping required)
 * and falls back to the legacy JSON format for versions saved before the
 * format change.
 */
export function parseAIResponse(raw: string): ParsedAIResponse {
  let cleaned = raw.trim();

  // Strip markdown code fences (in case the model wraps the whole response)
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:\w*)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }

  if (cleaned.includes("<<<FILE:")) {
    // Never salvage unterminated files through the legacy JSON fallback: a
    // half-written file breaks the preview with confusing syntax errors.
    return parseDelimitedResponse(cleaned);
  }

  return parseJsonResponse(cleaned);
}

/** Parse the current delimited format — files are copied verbatim, no escaping. */
function parseDelimitedResponse(text: string): ParsedAIResponse {
  const files: Record<string, string> = {};
  const fileRegex = /<<<FILE:([^>]+)>>>\r?\n?([\s\S]*?)<<<END_FILE>>>/g;
  let match: RegExpExecArray | null;
  while ((match = fileRegex.exec(text)) !== null) {
    const path = match[1].trim();
    if (path) files[path] = match[2].replace(/\n$/, "");
  }

  const plan: string[] = [];
  const planMatch = text.match(/<<<PLAN>>>\r?\n?([\s\S]*?)<<<END_PLAN>>>/);
  if (planMatch) {
    for (const line of planMatch[1].split("\n")) {
      const trimmed = line.trim();
      if (trimmed) plan.push(trimmed);
    }
  }

  let description = "";
  const descMatch = text.match(
    /<<<DESCRIPTION>>>\r?\n?([\s\S]*?)<<<END_DESCRIPTION>>>/,
  );
  if (descMatch) description = descMatch[1].trim();
  if (!description) {
    description =
      Object.keys(files).length > 0
        ? "App updated."
        : "Failed to parse AI response.";
  }

  const dependencies: Record<string, string> = {};
  const depsMatch = text.match(
    /<<<DEPENDENCIES>>>\r?\n?([\s\S]*?)<<<END_DEPENDENCIES>>>/,
  );
  if (depsMatch) {
    for (const line of depsMatch[1].split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const idx = trimmed.indexOf(":");
      if (idx === -1) continue;
      const name = trimmed.slice(0, idx).trim();
      const version = trimmed.slice(idx + 1).trim();
      if (name && version) dependencies[name] = version;
    }
  }

  return { plan, files, description, dependencies };
}

/**
 * Parse a legacy JSON response from the AI (versions saved before the
 * format switched to the delimited plain-text format above).
 * Also handles partial/truncated JSON by trying to repair it.
 */
function parseJsonResponse(cleaned: string): ParsedAIResponse {
  // 1. Try direct JSON.parse
  try {
    const parsed = JSON.parse(cleaned);
    console.log("[parseAI] direct JSON.parse succeeded");
    return extractFields(parsed);
  } catch (parseError) {
    console.warn(
      "[parseAI] JSON.parse failed, attempting repair…",
      (parseError as Error).message?.slice(0, 80),
    );
  }

  // 2. Try repairing truncated JSON (close open strings / braces)
  const repaired = repairTruncatedJson(cleaned);
  if (repaired) {
    try {
      const parsed = JSON.parse(repaired);
      console.log("[parseAI] repaired JSON succeeded");
      return extractFields(parsed);
    } catch (repairError) {
      console.warn("[parseAI] repaired JSON still invalid:", (repairError as Error).message?.slice(0, 80));
    }
  }

  // 3. Regex fallback — extract individual pieces
  console.warn("[parseAI] falling back to regex extraction");
  const files = extractFilesRegex(cleaned);
  const plan = extractPlanRegex(cleaned);
  const description = extractDescriptionRegex(cleaned);
  const dependencies = extractDependenciesRegex(cleaned);

  if (Object.keys(files).length > 0) {
    return {
      plan,
      files,
      description: description || "App generated (response was partially truncated).",
      dependencies,
    };
  }

  return {
    plan: [],
    files: {},
    description: "Failed to parse AI response.",
    dependencies: {},
  };
}

// ── helpers ──

function extractFields(parsed: Record<string, unknown>) {
  return {
    plan: Array.isArray(parsed.plan) ? (parsed.plan as string[]) : [],
    files:
      typeof parsed.files === "object" && parsed.files
        ? (parsed.files as Record<string, string>)
        : {},
    description:
      typeof parsed.description === "string" ? parsed.description : "",
    dependencies:
      typeof parsed.dependencies === "object" && parsed.dependencies
        ? (parsed.dependencies as Record<string, string>)
        : {},
  };
}

/**
 * Attempt to repair truncated JSON by:
 * - Truncating at the last complete JSON string value
 * - Closing any unclosed braces / brackets
 */
function repairTruncatedJson(json: string): string | null {
  let inString = false;
  let escaped = false;
  let lastSafePos = 0;

  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      if (!inString) {
        // Just closed a string — safe truncation point
        lastSafePos = i + 1;
      }
      continue;
    }
    if (!inString) {
      if (ch === "}" || ch === "]" || ch === ",") {
        lastSafePos = i + 1;
      }
    }
  }

  // If we ended inside a string, truncate to last safe position
  let result = inString ? json.substring(0, lastSafePos) : json;

  // Remove any trailing comma before we close braces
  result = result.replace(/,\s*$/, "");

  // Count open/close braces and brackets
  let braces = 0;
  let brackets = 0;
  inString = false;
  escaped = false;

  for (const ch of result) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === "{") braces++;
      if (ch === "}") braces--;
      if (ch === "[") brackets++;
      if (ch === "]") brackets--;
    }
  }

  // Close any open brackets then braces
  for (let i = 0; i < brackets; i++) result += "]";
  for (let i = 0; i < braces; i++) result += "}";

  return result;
}

function extractFilesRegex(text: string): Record<string, string> {
  const files: Record<string, string> = {};

  // Match "src/...": "..." with proper escape handling
  const filePattern = /"(src\/[^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let match;
  while ((match = filePattern.exec(text)) !== null) {
    try {
      files[match[1]] = JSON.parse(`"${match[2]}"`);
    } catch {
      files[match[1]] = match[2];
    }
  }

  return files;
}

function extractPlanRegex(text: string): string[] {
  const plan: string[] = [];
  const planMatch = text.match(/"plan"\s*:\s*\[([\s\S]*?)\]/);
  if (planMatch) {
    const items = planMatch[1].match(/"((?:[^"\\]|\\.)*)"/g);
    if (items) {
      for (const item of items) {
        try {
          plan.push(JSON.parse(item));
        } catch {
          plan.push(item.replace(/^"|"$/g, ""));
        }
      }
    }
  }
  return plan;
}

function extractDescriptionRegex(text: string): string {
  const descMatch = text.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (descMatch) {
    try {
      return JSON.parse(`"${descMatch[1]}"`);
    } catch {
      return descMatch[1];
    }
  }
  return "";
}

function extractDependenciesRegex(text: string): Record<string, string> {
  const deps: Record<string, string> = {};
  const depsBlockMatch = text.match(/"dependencies"\s*:\s*\{([^}]*)\}/);
  if (depsBlockMatch) {
    const pairs = depsBlockMatch[1].match(/"([^"]+)"\s*:\s*"([^"]+)"/g);
    if (pairs) {
      for (const pair of pairs) {
        const pairMatch = pair.match(/"([^"]+)"\s*:\s*"([^"]+)"/);
        if (pairMatch) deps[pairMatch[1]] = pairMatch[2];
      }
    }
  }
  return deps;
}
