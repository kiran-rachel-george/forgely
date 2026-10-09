"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      richColors
      position="top-right"
      toastOptions={{
        style: {
          background: "#0f172a",
          color: "#e2e8f0",
          border: "1px solid #1e293b",
        },
      }}
    />
  );
}
