"use client";

import { useCallback, useState } from "react";
import type { WebContainer } from "@webcontainer/api";

export interface FSEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FSEntry[];
}

export function useFileSystem(instance: WebContainer | null) {
  const [tree, setTree] = useState<FSEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const readDirRecursive = useCallback(
    async (dirPath: string): Promise<FSEntry[]> => {
      if (!instance) return [];

      try {
        const entries = await instance.fs.readdir(dirPath, { withFileTypes: true });
        const result: FSEntry[] = [];

        for (const entry of entries) {
          const fullPath =
            dirPath === "." || dirPath === "/"
              ? entry.name
              : `${dirPath}/${entry.name}`;

          // Skip node_modules and .git to avoid huge trees
          if (entry.name === "node_modules" || entry.name === ".git") continue;

          if (entry.isDirectory()) {
            const children = await readDirRecursive(fullPath);
            result.push({
              name: entry.name,
              path: fullPath,
              isDirectory: true,
              children,
            });
          } else {
            result.push({
              name: entry.name,
              path: fullPath,
              isDirectory: false,
            });
          }
        }

        // Sort: directories first, then files, alphabetically
        result.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });

        return result;
      } catch (readDirError) {
        console.warn(`[useFileSystem] Failed to read directory "${dirPath}":`, readDirError);
        return [];
      }
    },
    [instance],
  );

  const refreshTree = useCallback(async () => {
    if (!instance) return;
    setLoading(true);
    const entries = await readDirRecursive(".");
    setTree(entries);
    setLoading(false);
  }, [instance, readDirRecursive]);

  const readFile = useCallback(
    async (path: string): Promise<string> => {
      if (!instance) return "";
      try {
        return await instance.fs.readFile(path, "utf-8");
      } catch (readFileError) {
        console.warn(`[useFileSystem] Failed to read file "${path}":`, readFileError);
        return "";
      }
    },
    [instance],
  );

  const writeFile = useCallback(
    async (path: string, content: string) => {
      if (!instance) return;
      await instance.fs.writeFile(path, content);
    },
    [instance],
  );

  return { tree, loading, refreshTree, readFile, writeFile };
}
