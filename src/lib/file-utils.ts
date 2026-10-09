import type { ProjectFile } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  File‑tree node used by the explorer UI                            */
/* ------------------------------------------------------------------ */

export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: FileTreeNode[];
}

/* ------------------------------------------------------------------ */
/*  Parse / serialise the multi‑file delimiter format                 */
/*                                                                    */
/*  --- FILE: src/App.tsx ---                                         */
/*  code …                                                            */
/*                                                                    */
/*  --- FILE: src/components/Header.tsx ---                            */
/*  code …                                                            */
/* ------------------------------------------------------------------ */

const FILE_DELIMITER = /^--- FILE:\s*(.+?)\s*---$/gm;

export function parseProjectFiles(raw: string): ProjectFile[] {
  if (!raw || !raw.trim()) return [];

  const positions: { path: string; contentStart: number }[] = [];
  let match: RegExpExecArray | null;

  // Reset lastIndex so the regex works fresh each call
  FILE_DELIMITER.lastIndex = 0;

  while ((match = FILE_DELIMITER.exec(raw)) !== null) {
    positions.push({
      path: match[1],
      contentStart: match.index + match[0].length,
    });
  }

  if (positions.length === 0) {
    // Backward‑compat: treat raw string as a single App.tsx
    return [{ path: "src/App.tsx", content: raw.trim() }];
  }

  const files: ProjectFile[] = [];

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].contentStart;
    const end =
      i + 1 < positions.length
        ? raw.lastIndexOf("\n", positions[i + 1].contentStart - positions[i + 1].path.length - 15)
        : raw.length;

    // Safer: use next delimiter index instead
    const safeEnd =
      i + 1 < positions.length
        ? raw.indexOf("\n--- FILE:", start)
        : raw.length;

    files.push({
      path: positions[i].path,
      content: raw.slice(start, safeEnd === -1 ? end : safeEnd).trim(),
    });
  }

  return files;
}

export function serializeProjectFiles(files: ProjectFile[]): string {
  return files
    .map((f) => `--- FILE: ${f.path} ---\n${f.content}`)
    .join("\n\n");
}

/* ------------------------------------------------------------------ */
/*  Build a tree structure from flat file paths                       */
/* ------------------------------------------------------------------ */

export function buildFileTree(files: ProjectFile[]): FileTreeNode {
  const root: FileTreeNode = {
    name: "src",
    path: "src",
    isDirectory: true,
    children: [],
  };

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;
    const startIdx = parts[0] === "src" ? 1 : 0;

    for (let i = startIdx; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (isLast) {
        if (!current.children.find((c) => c.name === part && !c.isDirectory)) {
          current.children.push({
            name: part,
            path: file.path,
            isDirectory: false,
            children: [],
          });
        }
      } else {
        let dir = current.children.find(
          (c) => c.name === part && c.isDirectory,
        );
        if (!dir) {
          const dirPath = parts.slice(0, i + 1).join("/");
          dir = { name: part, path: dirPath, isDirectory: true, children: [] };
          current.children.push(dir);
        }
        current = dir;
      }
    }
  }

  // Sort: directories first, then alphabetically
  function sortNode(node: FileTreeNode) {
    node.children.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortNode);
  }
  sortNode(root);

  return root;
}
