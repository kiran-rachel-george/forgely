"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, prompt?: string) => Promise<void>;
}

export function CreateProjectModal({
  open,
  onOpenChange,
  onCreate,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!name.trim()) {
      return;
    }

    setBusy(true);

    try {
      await onCreate(name.trim(), prompt.trim() || undefined);
      setName("");
      setPrompt("");
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Create project">
      <div className="space-y-4">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Project name"
          autoFocus
        />
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Optional first prompt"
          className="min-h-[120px]"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={busy || !name.trim()}>
            {busy ? "Creating..." : "Create"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
