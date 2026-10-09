"use client";

/**
 * Shared auth helpers used by login and signup pages.
 * Extracted to avoid duplication.
 */

/** Sync the authenticated user's profile to the backend. */
export async function syncProfile(token: string): Promise<void> {
  await fetch("/api/profile/sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** Create a project from a prompt and return the project ID. */
export async function createProjectFromPrompt(
  token: string,
  prompt: string,
): Promise<string> {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: prompt.length > 42 ? `${prompt.slice(0, 42)}...` : prompt,
      prompt,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create project");
  }

  const payload = await response.json();
  return payload.project?.id as string;
}
