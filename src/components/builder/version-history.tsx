"use client";

import { useState } from "react";
import { History, RotateCcw, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { createTwoFilesPatch } from "diff";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Version } from "@/lib/types";

interface VersionHistoryProps {
  versions: Version[];
  currentVersionId?: string;
  onRestore: (versionId: string) => void;
  isRestoring?: boolean;
}

export function VersionHistory({ versions, currentVersionId, onRestore, isRestoring }: VersionHistoryProps) {
  const [expanded, setExpanded] = useState(true);
  const [showDiff, setShowDiff] = useState<string | null>(null);

  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);
  const latestId = sortedVersions[0]?.id;

  const getDiff = (version: Version) => {
    const index = versions.findIndex((v) => v.id === version.id);
    if (index <= 0) return null;
    const prev = versions[index - 1];
    return createTwoFilesPatch(
      `v${prev.version_number}`,
      `v${version.version_number}`,
      prev.code,
      version.code,
      "",
      "",
    );
  };

  return (
    <div className="border-t border-slate-800">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-slate-800/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-cyan-400" />
          Version History
          <Badge variant="muted" className="text-xs">{versions.length}</Badge>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="max-h-64 overflow-y-auto px-2 pb-2">
          {sortedVersions.map((version) => {
            const isCurrent = version.id === latestId;
            const diff = showDiff === version.id ? getDiff(version) : null;

            return (
              <div
                key={version.id}
                className="group mb-1 rounded-lg border border-slate-800 bg-slate-900/50 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-300">
                        v{version.version_number}
                      </span>
                      {isCurrent && (
                        <Badge variant="success" className="text-[10px]">Current</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{version.prompt}</p>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-600">
                      <Clock className="h-3 w-3" />
                      {formatDate(version.created_at)}
                    </div>
                  </div>
                  <div className="ml-2 flex items-center gap-1">
                    {versions.indexOf(version) > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => setShowDiff(showDiff === version.id ? null : version.id)}
                      >
                        Diff
                      </Button>
                    )}
                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-2 text-[10px]"
                        onClick={() => onRestore(version.id)}
                        disabled={isRestoring}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>

                {diff && (
                  <pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-950 p-2 font-mono text-[10px] leading-relaxed text-slate-400">
                    {diff}
                  </pre>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
