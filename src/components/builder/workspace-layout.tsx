"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Code2,
  Columns2,
  Download,
  Terminal as TerminalIcon,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import { ChatPanel, type PlanStep } from "./chat-panel";
import { EditorPanel } from "./editor-panel";
import { PreviewPanel } from "./preview-panel";
import { StreamingCodeView } from "./streaming-code-view";
import { TerminalPanel } from "./terminal-panel";
import { TopBar } from "@/components/topbar/top-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { useWebContainer } from "@/hooks/useWebContainer";
import { useDevServer } from "@/hooks/useDevServer";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useProject } from "@/hooks/useProject";
import { useChat } from "@/hooks/useChat";
import { useCredits } from "@/hooks/useCredits";
import { CreditBadge } from "@/components/ui/credit-badge";
import { CreditBanner } from "@/components/builder/credit-banner";
import {
  convertToWebContainerFiles,
  parseAIResponse,
} from "@/lib/file-converter";
import { downloadProjectZip } from "@/lib/export-project";
import { STARTER_FILES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type ViewMode = "preview" | "code" | "split";

interface WorkspaceLayoutProps {
  projectId: string;
  autoPrompt?: string;
  user: {
    email: string | null;
    name: string | null;
    avatar_url: string | null;
  };
}

/** Parse a version's code field — delimited (current), JSON (legacy), or raw code (oldest). */
function parseVersionCode(code: string): Record<string, string> {
  if (!code) return { ...STARTER_FILES };
  const { files } = parseAIResponse(code);
  if (Object.keys(files).length > 0) return files;
  // Fallback: merge oldest-format raw code as App.tsx into starter files
  return { ...STARTER_FILES, "src/App.tsx": code };
}

export function WorkspaceLayout({
  projectId,
  autoPrompt = "",
  user,
}: WorkspaceLayoutProps) {
  const router = useRouter();

  // UI state
  const [prompt, setPrompt] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [autoRan, setAutoRan] = useState(false);

  // Track the view the user had BEFORE generation started, so we can
  // return to preview automatically when generation completes.
  const preGenViewRef = useRef<ViewMode>("preview");

  // Files state — initialized immediately from DB, not from WebContainer
  const [currentFiles, setCurrentFiles] = useState<Record<string, string>>({
    ...STARTER_FILES,
  });
  const [mounted, setMounted] = useState(false);
  const mountingRef = useRef(false);
  const filesInitialized = useRef(false);

  // Plan steps (shown during generation)
  const [plan, setPlan] = useState<PlanStep[]>([]);

  // ── Core hooks ──
  const { instance, booting, isFallback, error: wcError } = useWebContainer();
  const {
    previewUrl,
    installing,
    starting,
    ready,
    startDevServer,
    stopDevServer,
  } = useDevServer(instance);
  const { tree, refreshTree, readFile, writeFile } = useFileSystem(instance);
  const {
    project,
    versions,
    messages,
    currentCode,
    setCurrentCode,
    loading,
    saving,
    loadProject,
    renameProject,
    deleteProject,
    saveManualVersion,
    restoreVersion,
    undoLastAIChange,
  } = useProject({ projectId });
  const { isGenerating, streamedCode, generate } = useChat();
  const { credits, refresh: refreshCredits } = useCredits();

  // Derived
  const projectName = useMemo(
    () => project?.name ?? "Loading...",
    [project?.name],
  );

  // ── Multi-tab state (persisted in localStorage) ──
  const TABS_STORAGE_KEY = "appbuilder_open_tabs";

  const [openTabs, setOpenTabs] = useState<{ id: string; name: string }[]>([]);

  // Initialize tabs from localStorage on mount, always include current project
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TABS_STORAGE_KEY);
      const parsed: { id: string; name: string }[] = stored ? JSON.parse(stored) : [];
      // Ensure current project is in the list
      if (!parsed.some((t) => t.id === projectId)) {
        parsed.push({ id: projectId, name: projectName });
      }
      setOpenTabs(parsed);
    } catch {
      setOpenTabs([{ id: projectId, name: projectName }]);
    }
  }, [projectId, projectName]);

  // Persist tabs to localStorage whenever they change
  useEffect(() => {
    if (openTabs.length === 0) return;
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(openTabs));
  }, [openTabs]);

  // Update the current tab's name when projectName changes
  useEffect(() => {
    setOpenTabs((prev) =>
      prev.map((t) => (t.id === projectId ? { ...t, name: projectName } : t)),
    );
  }, [projectId, projectName]);

  const tabs = useMemo(
    () =>
      openTabs.map((t) => ({
        id: t.id,
        name: t.name,
        active: t.id === projectId,
      })),
    [openTabs, projectId],
  );

  // Tab handlers
  function handleTabClose(tabId: string) {
    const remaining = openTabs.filter((t) => t.id !== tabId);
    setOpenTabs(remaining);
    if (tabId === projectId) {
      if (remaining.length > 0) {
        router.push(`/project/${remaining[remaining.length - 1].id}`);
      } else {
        router.push("/dashboard");
      }
    }
  }

  function handleCloseOthers(keepId: string) {
    setOpenTabs((prev) => prev.filter((t) => t.id === keepId));
    if (keepId !== projectId) {
      router.push(`/project/${keepId}`);
    }
  }

  function handleCloseAll() {
    setOpenTabs([]);
    router.push("/dashboard");
  }

  function handleTabRename(tabId: string, newName: string) {
    setOpenTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, name: newName } : t)),
    );
  }

  function handleTabDelete(tabId: string) {
    const remaining = openTabs.filter((t) => t.id !== tabId);
    setOpenTabs(remaining);
    if (tabId === projectId) {
      if (remaining.length > 0) {
        router.push(`/project/${remaining[remaining.length - 1].id}`);
      } else {
        router.push("/dashboard");
      }
    }
  }

  // ── Load project from DB ──
  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  // ── Initialize files from DB as soon as project loads (no WebContainer needed) ──
  useEffect(() => {
    if (loading || filesInitialized.current) return;

    if (!currentCode && versions.length === 0) {
      // New project → use starter files
      setCurrentFiles({ ...STARTER_FILES });
      filesInitialized.current = true;
      return;
    }
    if (!currentCode) return;

    const files = parseVersionCode(currentCode);
    setCurrentFiles(files);
    filesInitialized.current = true;
  }, [loading, currentCode, versions.length]);

  // Log WebContainer errors (isFallback is set automatically by the hook)
  useEffect(() => {
    if (wcError) console.error("WebContainer failed:", wcError);
  }, [wcError]);

  // ── Mount files into WebContainer once ready (optional — enhances preview) ──
  useEffect(() => {
    if (!instance || loading || mountingRef.current || mounted) return;
    if (!filesInitialized.current) return;

    void mountFilesToContainer(currentFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instance, loading, mounted, currentFiles]);

  async function mountFilesToContainer(files: Record<string, string>) {
    if (!instance || mountingRef.current) return;
    mountingRef.current = true;

    try {
      const wcFiles = convertToWebContainerFiles(files);
      await instance.mount(wcFiles);
      setCurrentFiles(files);
      setMounted(true);
      await refreshTree();

      // Auto-start dev server if not already running
      if (!ready && !installing && !starting) {
        await startDevServer();
        // Refresh tree again after install to pick up any generated files
        await refreshTree();
      }
    } catch (err) {
      console.error("Mount failed:", err);
      toast.error("Failed to mount files in container");
    } finally {
      mountingRef.current = false;
    }
  }

  // ── Auto-run prompt (from URL query param) ──
  useEffect(() => {
    if (!autoPrompt || autoRan || loading || !filesInitialized.current) return;
    setAutoRan(true);
    setPrompt(autoPrompt);
    void handleGenerate(autoPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrompt, autoRan, loading, currentFiles]);

  // ── AI generation ──
  async function handleGenerate(rawPrompt?: string) {
    const value = (rawPrompt ?? prompt).trim();
    if (!value) return;

    if (!rawPrompt) setPrompt("");
    setPlan([]);

    // ── Switch to CODE view while generating ──
    preGenViewRef.current = viewMode;
    setViewMode("code");

    try {
      const result = await generate({
        projectId,
        prompt: value,
        previousFiles: currentFiles,
        messages,
        onStreamChunk: () => {
          /* streaming text is tracked in useChat */
        },
        onComplete: async (responseText: string) => {
          // Parse AI response
          const parsed = parseAIResponse(responseText);

          console.log(
            "[gen] parsed files:",
            Object.keys(parsed.files),
            "| deps:",
            Object.keys(parsed.dependencies),
            "| description:",
            parsed.description.slice(0, 80),
          );

          // Show plan steps
          if (parsed.plan.length > 0) {
            setPlan(
              parsed.plan.map((text) => ({
                text,
                status: "done" as const,
              })),
            );
          }

          // Merge only src/ files from AI into the current files
          const fileCount = Object.keys(parsed.files).length;
          if (fileCount > 0) {
            const merged = { ...currentFiles };
            for (const [path, content] of Object.entries(parsed.files)) {
              merged[path] = content;
            }

            // If AI requested extra npm dependencies, install them
            if (
              instance &&
              parsed.dependencies &&
              Object.keys(parsed.dependencies).length > 0
            ) {
              try {
                const pkgRaw = await instance.fs.readFile(
                  "package.json",
                  "utf-8",
                );
                const pkg = JSON.parse(pkgRaw);
                pkg.dependencies = {
                  ...pkg.dependencies,
                  ...parsed.dependencies,
                };
                await instance.fs.writeFile(
                  "package.json",
                  JSON.stringify(pkg, null, 2),
                );
                merged["package.json"] = JSON.stringify(pkg, null, 2);

                const installProc = await instance.spawn("npm", ["install"]);
                await installProc.exit;
              } catch (depErr) {
                console.error("Failed to install extra dependencies:", depErr);
              }
            }

            setCurrentFiles(merged);

            console.log(
              "[gen] updated currentFiles, total files:",
              Object.keys(merged).length,
              "| src/ files:",
              Object.keys(merged).filter(p => p.startsWith("src/")).length,
              "| has App.tsx:",
              !!merged["src/App.tsx"],
            );

            // Write files into WebContainer individually so Vite's
            // file-system watcher fires HMR updates for each change.
            if (instance) {
              try {
                for (const [path, content] of Object.entries(parsed.files)) {
                  const dir = path.substring(0, path.lastIndexOf("/"));
                  if (dir) {
                    await instance.fs.mkdir(dir, { recursive: true });
                  }
                  await instance.fs.writeFile(path, content);
                }
                console.log(
                  `[gen] wrote ${fileCount} files to WebContainer`,
                );
                await refreshTree();

                // Start dev server if not already running
                if (!ready && !installing && !starting) {
                  await startDevServer();
                }
              } catch (wcErr) {
                console.error("Failed to write files to WebContainer:", wcErr);
              }
            }
          } else {
            console.warn(
              "[gen] no files parsed from AI response, raw length:",
              responseText.length,
            );
          }

          // Reload project data from DB
          await loadProject();

          // Clear plan after delay
          setTimeout(() => setPlan([]), 3000);
        },
      });

      toast.success("Generation complete");

      // ── Auto-switch to PREVIEW after generation completes ──
      // Small delay so Sandpack has time to pick up new files.
      setTimeout(() => setViewMode("preview"), 800);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Generation failed",
      );
      setPlan([]);
    } finally {
      // The server takes a credit per generation and refunds it on failure.
      void refreshCredits();
    }
  }

  // ── File editing from the editor ──
  const handleFileChange = useCallback(
    (path: string, content: string) => {
      setCurrentFiles((prev) => ({ ...prev, [path]: content }));
    },
    [],
  );

  // ── Undo ──
  async function handleUndo() {
    try {
      const version = await undoLastAIChange();
      if (!version) {
        toast.info("No previous version to restore");
        return;
      }
      const files = parseVersionCode(version.code);
      await mountFilesToContainer(files);
      toast.success("Reverted to previous version");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Undo failed");
    }
  }

  // ── Download project as zip ──
  async function handleDownload() {
    try {
      await downloadProjectZip(projectName, currentFiles);
      toast.success("Project downloaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to download project",
      );
    }
  }

  // ── Status text ──
  const isWcLoading = booting || (!mounted && !isFallback && !!instance);
  const loadingStatus = booting
    ? "Booting environment..."
    : !mounted && !isFallback
      ? "Initializing Vite + React project..."
      : installing
        ? "Running npm install..."
        : starting
          ? "Starting Vite dev server..."
          : "";

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="flex h-screen flex-col bg-[#0a0a0a]">
        <div className="h-12 border-b border-[#2a2a2a] bg-[#1a1a1a]" />
        <div className="flex flex-1">
          <Skeleton className="h-full w-[380px] bg-[#1a1a1a]" />
          <Skeleton className="h-full flex-1 bg-[#111]" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a]">
      {/* ===== TOP BAR ===== */}
      <TopBar
        tabs={tabs}
        activeTabId={projectId}
        onTabClick={(id) => router.push(`/project/${id}`)}
        onTabClose={handleTabClose}
        onCloseOthers={handleCloseOthers}
        onCloseAll={handleCloseAll}
        onRename={handleTabRename}
        onDelete={handleTabDelete}
        onNewProject={() => router.push("/dashboard")}
      />

      {/* ===== SUB BAR ===== */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#2a2a2a] bg-[#111] px-3">
        {/* Left: project name + status */}
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-white">
            {projectName}
          </span>
          <span className="text-[11px] text-[#555]">
            {booting
              ? "Booting..."
              : isFallback
                ? "Fallback mode"
                : !mounted
                  ? "Initializing Vite..."
                  : ready
                    ? "Live"
                    : installing
                      ? "Installing deps..."
                      : starting
                        ? "Starting Vite..."
                        : ""}
          </span>
          {ready && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          )}
          {isFallback && !ready && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          )}
          <span className="rounded border border-[#2a2a2a] bg-[#1a1a1a] px-1.5 py-0.5 text-[10px] text-[#888]">
            Vite + Frontend
          </span>
        </div>

        {/* Center: view mode toggles */}
        <div className="flex items-center gap-0.5 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-0.5">
          <button
            onClick={() => setViewMode("preview")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition",
              viewMode === "preview"
                ? "bg-sky-500 text-white"
                : "text-[#a1a1a1] hover:text-white",
            )}
          >
            <Eye className="h-3 w-3" />
            Preview
          </button>
          <button
            onClick={() => setViewMode("split")}
            className={cn(
              "rounded-md p-1 transition",
              viewMode === "split"
                ? "bg-sky-500 text-white"
                : "text-[#a1a1a1] hover:text-white",
            )}
          >
            <Columns2 className="h-3 w-3" />
          </button>
          <button
            onClick={() => setViewMode("code")}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1 text-[11px] font-medium transition",
              viewMode === "code"
                ? "bg-sky-500 text-white"
                : "text-[#a1a1a1] hover:text-white",
            )}
          >
            <Code2 className="h-3 w-3" />
            Code
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <CreditBadge credits={credits} />
          <button
            onClick={handleUndo}
            className="rounded-md p-1 text-[#a1a1a1] transition hover:text-white"
            title="Undo last AI change"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDownload}
            className="rounded-md p-1 text-[#a1a1a1] transition hover:text-white"
            title="Download project as zip"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTerminalOpen(!terminalOpen)}
            className={cn(
              "rounded-md p-1 transition",
              terminalOpen
                ? "text-sky-400"
                : "text-[#a1a1a1] hover:text-white",
            )}
            title="Toggle terminal"
          >
            <TerminalIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex min-h-0 flex-1">
        {/* Left: Chat Panel */}
        <div className="flex w-[380px] shrink-0 flex-col border-r border-[#2a2a2a] bg-[#111]">
          {credits === 0 && (
            <CreditBanner
              credits={credits}
              onBuyCredits={() => toast.info("Buying credits isn't available yet.")}
            />
          )}
          <ChatPanel
            messages={messages}
            prompt={prompt}
            onPromptChange={setPrompt}
            onSubmit={() => handleGenerate()}
            isGenerating={isGenerating}
            streamingText={streamedCode}
            plan={plan}
          />
        </div>

        {/* Right: Editor / Preview + Terminal */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Editor / Preview area */}
          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* Code / Editor panel — show streaming view while generating */}
            {(viewMode === "code" || viewMode === "split") && (
              <div
                className={cn(
                  "h-full min-h-0",
                  viewMode === "split"
                    ? "w-1/2 border-r border-[#2a2a2a]"
                    : "w-full",
                )}
              >
                {isGenerating ? (
                  <StreamingCodeView
                    code={streamedCode}
                    isGenerating={isGenerating}
                  />
                ) : (
                  <EditorPanel
                    tree={tree}
                    readFile={readFile}
                    writeFile={writeFile}
                    onFileChange={handleFileChange}
                    fallbackFiles={currentFiles}
                    isFallback={isFallback}
                  />
                )}
              </div>
            )}

            {/* Preview panel */}
            {(viewMode === "preview" || viewMode === "split") && (
              <div
                className={cn(
                  "h-full min-h-0",
                  viewMode === "split" ? "w-1/2" : "w-full",
                )}
              >
                <PreviewPanel
                  previewUrl={previewUrl}
                  isLoading={isWcLoading || installing || starting}
                  loadingStatus={loadingStatus}
                  fallbackFiles={currentFiles}
                  isFallback={isFallback}
                  isGenerating={isGenerating}
                />
              </div>
            )}
          </div>

          {/* Terminal */}
          <TerminalPanel
            instance={instance}
            isOpen={terminalOpen}
            onToggle={() => setTerminalOpen(!terminalOpen)}
          />
        </div>
      </div>
    </div>
  );
}
