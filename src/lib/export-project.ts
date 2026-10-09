"use client";

import JSZip from "jszip";
import { saveAs } from "file-saver";

function sanitizeFileName(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40) || "ai-app";
}

/**
 * Zip the project's current flat file map (already the merged starter +
 * AI-generated files used to mount the WebContainer / render the preview)
 * and trigger a browser download.
 */
export async function downloadProjectZip(
  projectName: string,
  files: Record<string, string>,
) {
  const zip = new JSZip();
  const folderName = sanitizeFileName(projectName);
  const root = zip.folder(folderName);

  if (!root) {
    throw new Error("Failed to create zip folder");
  }

  for (const [filePath, content] of Object.entries(files)) {
    root.file(filePath, content);
  }

  root.file("README.md", "Run `npm install` then `npm run dev`.");

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${folderName}.zip`);
}
