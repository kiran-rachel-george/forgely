"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Plus } from "lucide-react";
import { toast } from "sonner";

import { ProjectTab, type TabInfo } from "@/components/topbar/project-tab";
import { apiFetch } from "@/lib/api-client";

interface TopBarProps {
  tabs: TabInfo[];
  activeTabId: string;
  onTabClick: (id: string) => void;
  onTabClose: (id: string) => void;
  onCloseOthers: (keepId: string) => void;
  onCloseAll: () => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onNewProject: () => void;
}

interface ContextMenuState {
  x: number;
  y: number;
  tabId: string;
  tabName: string;
}

export function TopBar({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onCloseOthers,
  onCloseAll,
  onRename,
  onDelete,
  onNewProject,
}: TopBarProps) {
  const router = useRouter();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Rename dialog state
  const [renameState, setRenameState] = useState<{ id: string; name: string } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Close context menu when clicking outside
  useEffect(() => {
    if (!contextMenu) return;
    function handleClick(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setContextMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [contextMenu]);

  // Focus rename input when dialog opens
  useEffect(() => {
    if (renameState && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renameState]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, tab: TabInfo) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id, tabName: tab.name });
    },
    [],
  );

  function handleCloseTab(tabId: string) {
    setContextMenu(null);
    onTabClose(tabId);
  }

  function handleCloseOthers(keepId: string) {
    setContextMenu(null);
    onCloseOthers(keepId);
  }

  function handleCloseAllTabs() {
    setContextMenu(null);
    onCloseAll();
  }

  function handleRenameStart(tabId: string, tabName: string) {
    setContextMenu(null);
    setRenameState({ id: tabId, name: tabName });
  }

  async function handleRenameSubmit() {
    if (!renameState) return;
    const newName = renameState.name.trim();
    if (!newName) {
      toast.error("Project name cannot be empty");
      return;
    }
    try {
      await apiFetch(`/api/projects/${renameState.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName }),
      });
      onRename(renameState.id, newName);
      toast.success("Project renamed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to rename project");
    }
    setRenameState(null);
  }

  async function handleDeleteProject(tabId: string) {
    setContextMenu(null);
    const confirmed = window.confirm("Delete this project? This cannot be undone.");
    if (!confirmed) return;
    try {
      await apiFetch(`/api/projects/${tabId}`, { method: "DELETE" });
      onDelete(tabId);
      toast.success("Project deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  return (
    <>
      <header className="flex h-12 shrink-0 items-center border-b border-[#2a2a2a] bg-[#1a1a1a]">
        {/* Left: Home + Tabs */}
        <div className="flex h-full min-w-0 flex-1 items-center">
          {/* Home button */}
          <button
            onClick={() => router.push("/dashboard")}
            className="flex h-full shrink-0 items-center gap-2 border-r border-[#2a2a2a] px-4 text-[#999] transition hover:bg-[#242424] hover:text-white"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="text-[12px] font-medium">Home</span>
          </button>

          {/* Project Tabs — scrollable */}
          <div className="flex h-full min-w-0 flex-1 items-center overflow-x-auto">
            {tabs.map((tab) => (
              <ProjectTab
                key={tab.id}
                tab={tab}
                onClick={() => onTabClick(tab.id)}
                onClose={() => onTabClose(tab.id)}
                onContextMenu={(e) => handleContextMenu(e, tab)}
              />
            ))}

            {/* New tab button */}
            <button
              onClick={onNewProject}
              className="flex h-full shrink-0 items-center px-3 text-[#555] transition hover:text-white"
              title="New project"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Right-click Context Menu ── */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 rounded-lg border border-[#333] bg-[#242424] py-1 shadow-xl min-w-[180px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => handleCloseTab(contextMenu.tabId)}
            className="flex w-full items-center px-3 py-1.5 text-left text-[13px] text-gray-300 hover:bg-[#333] transition"
          >
            Close
          </button>
          <button
            onClick={() => handleCloseOthers(contextMenu.tabId)}
            disabled={tabs.length <= 1}
            className="flex w-full items-center px-3 py-1.5 text-left text-[13px] text-gray-300 hover:bg-[#333] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Close Others
          </button>
          <button
            onClick={handleCloseAllTabs}
            className="flex w-full items-center px-3 py-1.5 text-left text-[13px] text-gray-300 hover:bg-[#333] transition"
          >
            Close All
          </button>

          <div className="my-1 border-t border-[#333]" />

          <button
            onClick={() => handleRenameStart(contextMenu.tabId, contextMenu.tabName)}
            className="flex w-full items-center px-3 py-1.5 text-left text-[13px] text-gray-300 hover:bg-[#333] transition"
          >
            Rename
          </button>
          <button
            onClick={() => handleDeleteProject(contextMenu.tabId)}
            className="flex w-full items-center px-3 py-1.5 text-left text-[13px] text-red-400 hover:bg-[#333] transition"
          >
            Delete Project
          </button>
        </div>
      )}

      {/* ── Rename Dialog ── */}
      {renameState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[360px] rounded-xl border border-[#333] bg-[#1e1e1e] p-5 shadow-2xl">
            <h3 className="mb-3 text-[14px] font-semibold text-white">Rename Project</h3>
            <input
              ref={renameInputRef}
              type="text"
              value={renameState.name}
              onChange={(e) => setRenameState({ ...renameState, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") setRenameState(null);
              }}
              className="w-full rounded-lg border border-[#333] bg-[#111] px-3 py-2 text-[13px] text-white outline-none focus:border-sky-500 transition"
              placeholder="Project name"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRenameState(null)}
                className="rounded-lg px-3 py-1.5 text-[12px] text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                className="rounded-lg bg-sky-500 px-4 py-1.5 text-[12px] font-medium text-white hover:bg-sky-600 transition"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
