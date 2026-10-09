"use client";

import { useCallback, useEffect, useRef } from "react";
import type { WebContainer } from "@webcontainer/api";
import type { Terminal } from "xterm";

/**
 * Manages an xterm.js terminal connected to a WebContainer shell (jsh).
 */
export function useTerminal(
  instance: WebContainer | null,
  terminalEl: HTMLDivElement | null,
) {
  const termRef = useRef<Terminal | null>(null);
  const inputWriterRef = useRef<WritableStreamDefaultWriter | null>(null);

  useEffect(() => {
    if (!instance || !terminalEl) return;

    let disposed = false;

    async function init() {
      // Dynamically import xterm so it only loads client-side
      const { Terminal } = await import("xterm");
      const { FitAddon } = await import("@xterm/addon-fit");
      const { WebLinksAddon } = await import("@xterm/addon-web-links");

      // Inject xterm CSS if not already present
      if (!document.querySelector('link[data-xterm-css]')) {
        const link = document.createElement("style");
        link.setAttribute("data-xterm-css", "");
        // @ts-ignore - dynamic css import
        const css = await import("xterm/css/xterm.css?raw").catch(() => null);
        if (css?.default) link.textContent = css.default;
        document.head.appendChild(link);
      }

      if (disposed) return;

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 13,
        fontFamily: '"Fira Code", "Cascadia Code", Menlo, monospace',
        theme: {
          background: "#0d0d0d",
          foreground: "#e2e8f0",
          cursor: "#0ea5e9",
          selectionBackground: "#2563eb44",
        },
        convertEol: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());
      term.open(terminalEl!);
      fitAddon.fit();
      termRef.current = term;

      // Listen for resize
      const observer = new ResizeObserver(() => fitAddon.fit());
      observer.observe(terminalEl!);

      // Start jsh shell
      const shellProcess = await instance!.spawn("jsh", {
        terminal: { cols: term.cols, rows: term.rows },
      });

      // Pipe shell output → terminal
      shellProcess.output.pipeTo(
        new WritableStream({
          write(chunk) {
            if (!disposed) term.write(chunk);
          },
        }),
      );

      // Pipe terminal input → shell
      const writer = shellProcess.input.getWriter();
      inputWriterRef.current = writer;

      term.onData((data) => {
        writer.write(data);
      });

      term.onResize(({ cols, rows }) => {
        shellProcess.resize({ cols, rows });
      });

      return () => {
        observer.disconnect();
        term.dispose();
        termRef.current = null;
        inputWriterRef.current = null;
      };
    }

    init();

    return () => {
      disposed = true;
      if (termRef.current) {
        termRef.current.dispose();
        termRef.current = null;
      }
    };
  }, [instance, terminalEl]);

  const writeToTerminal = useCallback((text: string) => {
    if (termRef.current) {
      termRef.current.write(text);
    }
  }, []);

  return { terminal: termRef.current, writeToTerminal };
}
