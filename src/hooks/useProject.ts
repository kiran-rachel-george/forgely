"use client";

import { useCallback, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api-client";
import type { Message, Project, ProjectDetailResponse, Version } from "@/lib/types";

interface UseProjectOptions {
  projectId: string;
}

export function useProject({ projectId }: UseProjectOptions) {
  const [project, setProject] = useState<Project | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentCode, setCurrentCode] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const latestVersion = useMemo(() => {
    return versions.length ? versions[versions.length - 1] : null;
  }, [versions]);

  const loadProject = useCallback(async () => {
    setLoading(true);

    try {
      const payload = await apiFetch<ProjectDetailResponse>(`/api/projects/${projectId}`);
      setProject(payload.project);
      setVersions(payload.versions);
      setMessages(payload.messages);

      const latest = payload.versions[payload.versions.length - 1];
      setCurrentCode(latest?.code ?? "");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const renameProject = useCallback(
    async (name: string) => {
      const payload = await apiFetch<{ project: Project }>(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });

      setProject(payload.project);
      return payload.project;
    },
    [projectId],
  );

  const deleteProject = useCallback(async () => {
    await apiFetch<{ success: boolean }>(`/api/projects/${projectId}`, {
      method: "DELETE",
    });

    setProject(null);
    setVersions([]);
    setMessages([]);
    setCurrentCode("");
  }, [projectId]);

  const saveManualVersion = useCallback(
    async (code: string, prompt = "Manual save") => {
      setSaving(true);

      try {
        const payload = await apiFetch<{ version: Version }>(`/api/projects/${projectId}/versions`, {
          method: "POST",
          body: JSON.stringify({ code, prompt }),
        });

        setVersions((prev) => [...prev, payload.version]);
        setCurrentCode(payload.version.code);

        if (prompt && prompt !== "Manual save") {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              project_id: projectId,
              role: "assistant",
              content: prompt,
              created_at: new Date().toISOString(),
            },
          ]);
        }

        return payload.version;
      } finally {
        setSaving(false);
      }
    },
    [projectId],
  );

  const restoreVersion = useCallback(
    async (versionId: string) => {
      const payload = await apiFetch<{ version: Version }>(
        `/api/projects/${projectId}/versions/${versionId}/restore`,
        {
          method: "POST",
        },
      );

      setVersions((prev) => [...prev, payload.version]);
      setCurrentCode(payload.version.code);
      return payload.version;
    },
    [projectId],
  );

  const appendMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const appendVersion = useCallback((version: Version) => {
    setVersions((prev) => [...prev, version]);
    setCurrentCode(version.code);
  }, []);

  const undoLastAIChange = useCallback(async () => {
    if (versions.length < 2) {
      return null;
    }

    const previous = versions[versions.length - 2];
    return restoreVersion(previous.id);
  }, [restoreVersion, versions]);

  return {
    project,
    versions,
    latestVersion,
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
    appendMessage,
    appendVersion,
    setMessages,
    setVersions,
    undoLastAIChange,
  };
}
