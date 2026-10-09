"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FileCode2,
  Folder,
  FolderOpen,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { FileTreeNode } from "@/lib/file-utils";

/* ------------------------------------------------------------------ */
/*  Public component                                                  */
/* ------------------------------------------------------------------ */

interface FileExplorerProps {
  tree: FileTreeNode;
  activeFilePath: string;
  onFileSelect: (path: string) => void;
}

export function FileExplorer({
  tree,
  activeFilePath,
  onFileSelect,
}: FileExplorerProps) {
  return (
    <div className="h-full overflow-y-auto bg-[#111] py-2">
      <div className="px-3 pb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#555]">
          Explorer
        </span>
      </div>
      {/* Render root's children directly (skip the "src" wrapper visually) */}
      {tree.children.map((child) => (
        <TreeNode
          key={child.path}
          node={child}
          activeFilePath={activeFilePath}
          onFileSelect={onFileSelect}
          depth={0}
          defaultOpen
        />
      ))}
      {/* If tree has no children, show the root files */}
      {tree.children.length === 0 && !tree.isDirectory && (
        <FileRow
          name={tree.name}
          path={tree.path}
          isActive={tree.path === activeFilePath}
          depth={0}
          onSelect={() => onFileSelect(tree.path)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recursive tree node                                               */
/* ------------------------------------------------------------------ */

function TreeNode({
  node,
  activeFilePath,
  onFileSelect,
  depth,
  defaultOpen = false,
}: {
  node: FileTreeNode;
  activeFilePath: string;
  onFileSelect: (path: string) => void;
  depth: number;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen || depth < 2);

  if (node.isDirectory) {
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
            {node.name}
          </span>
        </button>
        {isOpen && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                activeFilePath={activeFilePath}
                onFileSelect={onFileSelect}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <FileRow
      name={node.name}
      path={node.path}
      isActive={node.path === activeFilePath}
      depth={depth}
      onSelect={() => onFileSelect(node.path)}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Single file row                                                   */
/* ------------------------------------------------------------------ */

function FileRow({
  name,
  path,
  isActive,
  depth,
  onSelect,
}: {
  name: string;
  path: string;
  isActive: boolean;
  depth: number;
  onSelect: () => void;
}) {
  const ext = name.split(".").pop() ?? "";
  const isTsx = ext === "tsx" || ext === "jsx";
  const isTs = ext === "ts";

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-1.5 py-[3px] text-left transition",
        isActive
          ? "bg-sky-500/10 text-sky-400"
          : "text-[#888] hover:bg-[#1c1c1c] hover:text-[#a1a1a1]",
      )}
      style={{ paddingLeft: `${depth * 12 + 26}px` }}
    >
      <FileCode2
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          isTsx
            ? "text-sky-400/70"
            : isTs
              ? "text-emerald-400/70"
              : "text-[#555]",
        )}
      />
      <span className="truncate text-[12px]">{name}</span>
    </button>
  );
}
