"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileCode2,
  Folder,
  FolderOpen,
  X,
} from "lucide-react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

import type { FSEntry } from "@/hooks/useFileSystem";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface EditorPanelProps {
  /** File tree from WebContainer (used when not in fallback mode) */
  tree: FSEntry[];
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  onFileChange?: (path: string, content: string) => void;
  /** In-memory files for fallback mode */
  fallbackFiles?: Record<string, string>;
  /** Whether we're in Sandpack fallback mode */
  isFallback?: boolean;
}

/** Convert flat file map to tree structure for fallback mode */
function buildTreeFromFiles(files: Record<string, string>): FSEntry[] {
  const root: FSEntry[] = [];
  const dirs = new Map<string, FSEntry>();

  // Sort paths so directories come before their children
  const paths = Object.keys(files).sort();

  for (const filePath of paths) {
    const parts = filePath.split("/");
    let currentLevel = root;
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLastPart = i === parts.length - 1;

      if (isLastPart) {
        // It's a file
        currentLevel.push({
          name: part,
          path: filePath,
          isDirectory: false,
        });
      } else {
        // It's a directory
        let dir = dirs.get(currentPath);
        if (!dir) {
          dir = {
            name: part,
            path: currentPath,
            isDirectory: true,
            children: [],
          };
          dirs.set(currentPath, dir);
          currentLevel.push(dir);
        }
        currentLevel = dir.children!;
      }
    }
  }

  // Sort: directories first, then files
  function sortEntries(entries: FSEntry[]) {
    entries.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const entry of entries) {
      if (entry.children) sortEntries(entry.children);
    }
  }
  sortEntries(root);

  return root;
}

export function EditorPanel({
  tree,
  readFile,
  writeFile,
  onFileChange,
  fallbackFiles,
  isFallback,
}: EditorPanelProps) {
  const [activeFile, setActiveFile] = useState<string>("src/App.tsx");
  const [openFiles, setOpenFiles] = useState<string[]>(["src/App.tsx"]);
  const [fileContent, setFileContent] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const writeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build file tree: use WebContainer tree or build from fallbackFiles
  const effectiveTree = useMemo(() => {
    if (isFallback && fallbackFiles && Object.keys(fallbackFiles).length > 0) {
      return buildTreeFromFiles(fallbackFiles);
    }
    return tree;
  }, [tree, fallbackFiles, isFallback]);

  // Load file content when active file changes
  useEffect(() => {
    if (!activeFile) return;

    // In fallback mode, read from in-memory files
    if (isFallback && fallbackFiles) {
      const content = fallbackFiles[activeFile] ?? "";
      setFileContent(content);
      setLoadingFile(false);
      return;
    }

    // Otherwise read from WebContainer
    let cancelled = false;
    setLoadingFile(true);
    readFile(activeFile).then((content) => {
      if (!cancelled) {
        setFileContent(content);
        setLoadingFile(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeFile, readFile, isFallback, fallbackFiles]);

  function handleFileSelect(path: string) {
    setActiveFile(path);
    if (!openFiles.includes(path)) {
      setOpenFiles((prev) => [...prev, path]);
    }
  }

  function handleCloseFile(path: string) {
    setOpenFiles((prev) => prev.filter((f) => f !== path));
    if (activeFile === path) {
      const remaining = openFiles.filter((f) => f !== path);
      setActiveFile(remaining[remaining.length - 1] ?? "");
    }
  }

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (value === undefined || !activeFile) return;
      setFileContent(value);
      onFileChange?.(activeFile, value);

      // In fallback mode, just notify parent (no WebContainer to write to)
      if (isFallback) return;

      // Debounce the write to WebContainer
      if (writeTimeoutRef.current) clearTimeout(writeTimeoutRef.current);
      writeTimeoutRef.current = setTimeout(() => {
        writeFile(activeFile, value);
      }, 300);
    },
    [activeFile, writeFile, onFileChange, isFallback],
  );

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme("bolt-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955" },
        { token: "keyword", foreground: "569CD6" },
        { token: "string", foreground: "CE9178" },
      ],
      colors: {
        "editor.background": "#0a0a0a",
        "editor.foreground": "#E2E8F0",
        "editor.selectionBackground": "#264F78",
        "editor.lineHighlightBackground": "#1a1a1a",
        "editorCursor.foreground": "#0ea5e9",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#94A3B8",
      },
    });
    monaco.editor.setTheme("bolt-dark");
  }, []);

  // Detect language from extension
  const fileName = activeFile?.split("/").pop() ?? "";
  const ext = fileName.split(".").pop() ?? "";
  const langMap: Record<string, string> = {
    tsx: "typescript",
    ts: "typescript",
    jsx: "javascript",
    js: "javascript",
    css: "css",
    json: "json",
    html: "html",
    md: "markdown",
  };
  const language = langMap[ext] ?? "plaintext";

  return (
    <div className="flex h-full">
      {/* File Explorer */}
      <div className="w-[180px] shrink-0 overflow-y-auto border-r border-[#2a2a2a] bg-[#111]">
        <div className="px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#555]">
            Files
          </span>
        </div>
        {effectiveTree.map((entry) => (
          <TreeNode
            key={entry.path}
            entry={entry}
            activeFile={activeFile}
            onFileSelect={handleFileSelect}
            depth={0}
          />
        ))}
        {effectiveTree.length === 0 && (
          <p className="px-3 py-4 text-[11px] text-[#444]">No files yet</p>
        )}
      </div>

      {/* Editor area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Open file tabs */}
        {openFiles.length > 0 && (
          <div className="flex h-8 shrink-0 items-center overflow-x-auto border-b border-[#2a2a2a] bg-[#111]">
            {openFiles.map((path) => (
              <div
                key={path}
                className={cn(
                  "flex h-full cursor-pointer items-center gap-1.5 border-r border-[#2a2a2a] px-3 text-[11px] transition",
                  path === activeFile
                    ? "bg-[#0a0a0a] text-white"
                    : "text-[#666] hover:text-[#a1a1a1]",
                )}
              >
                <span onClick={() => setActiveFile(path)}>
                  {path.split("/").pop()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseFile(path);
                  }}
                  className="ml-1 rounded p-0.5 hover:bg-[#333]"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Monaco editor */}
        <div className="min-h-0 flex-1">
          {loadingFile ? (
            <Skeleton className="h-full w-full bg-[#1a1a1a]" />
          ) : activeFile ? (
            <Editor
              height="100%"
              language={language}
              value={fileContent}
              onChange={handleEditorChange}
              onMount={handleMount}
              loading={<Skeleton className="h-full w-full" />}
              options={{
                fontSize: 13,
                fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 12 },
                lineNumbers: "on",
                renderLineHighlight: "line",
                bracketPairColorization: { enabled: true },
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                smoothScrolling: true,
                cursorBlinking: "smooth",
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-[12px] text-[#555]">Select a file to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  File tree node component                                          */
/* ------------------------------------------------------------------ */

function TreeNode({
  entry,
  activeFile,
  onFileSelect,
  depth,
}: {
  entry: FSEntry;
  activeFile: string;
  onFileSelect: (path: string) => void;
  depth: number;
}) {
  const [isOpen, setIsOpen] = useState(depth < 2);

  if (entry.isDirectory) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center gap-1.5 py-[3px] text-left transition hover:bg-[#1c1c1c]"
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isOpen ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-[#555]" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-[#555]" />
          )}
          {isOpen ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-sky-400/70" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-sky-400/70" />
          )}
          <span className="truncate text-[12px] text-[#a1a1a1]">
            {entry.name}
          </span>
        </button>
        {isOpen &&
          entry.children?.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
              depth={depth + 1}
            />
          ))}
      </div>
    );
  }

  const fileExt = entry.name.split(".").pop() ?? "";
  const iconColor = ["tsx", "ts"].includes(fileExt)
    ? "text-blue-400"
    : ["css"].includes(fileExt)
      ? "text-purple-400"
      : ["json"].includes(fileExt)
        ? "text-yellow-400"
        : ["html"].includes(fileExt)
          ? "text-orange-400"
          : "text-[#666]";

  return (
    <button
      onClick={() => onFileSelect(entry.path)}
      className={cn(
        "flex w-full items-center gap-1.5 py-[3px] text-left transition hover:bg-[#1c1c1c]",
        activeFile === entry.path && "bg-sky-500/10 text-sky-400",
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      <FileCode2 className={cn("h-3.5 w-3.5 shrink-0", iconColor)} />
      <span
        className={cn(
          "truncate text-[12px]",
          activeFile === entry.path ? "text-sky-400" : "text-[#888]",
        )}
      >
        {entry.name}
      </span>
    </button>
  );
}
