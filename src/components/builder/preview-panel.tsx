"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  Loader2,
  ExternalLink,
} from "lucide-react";

import { cn } from "@/lib/utils";

type DeviceMode = "desktop" | "tablet" | "mobile";

interface PreviewPanelProps {
  /** WebContainer dev-server URL (null when WC is unavailable) */
  previewUrl: string | null;
  /** True while WebContainer is still booting / installing / starting */
  isLoading: boolean;
  /** Human-readable status message for the loading spinner */
  loadingStatus: string;
  /** Full project files — used for inline preview */
  fallbackFiles?: Record<string, string> | null;
  /** Whether we've fallen back from WebContainer */
  isFallback?: boolean;
  /** True while AI is still streaming the response */
  isGenerating?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Build a self-contained HTML document from multi-file source code  */
/* ------------------------------------------------------------------ */

/**
 * Sort files so dependencies come before dependents.
 * types → utils → hooks → components → pages → App.tsx (last)
 */
function sortFiles(entries: [string, string][]): [string, string][] {
  const priority = (p: string) => {
    if (/\/types[/.]/.test(p)) return 0;
    if (/\/(utils|lib|helpers|constants|data)[/.]/.test(p)) return 1;
    if (/\/hooks[/.]/.test(p)) return 2;
    if (/\/components[/.]/.test(p)) return 3;
    if (/App\.[tj]sx?$/.test(p)) return 5;
    return 4;
  };
  return [...entries].sort(([a], [b]) => priority(a) - priority(b));
}

/** Build a full HTML preview document from the project files map. */
function buildSrcDoc(files: Record<string, string>, vendorScripts: string): string {
  // Only include src/ files (skip config, package.json, etc.)
  const srcEntries = Object.entries(files).filter(
    ([p]) =>
      p.startsWith("src/") &&
      !p.includes("main.tsx") &&
      !p.includes("main.jsx") &&
      !p.includes("vite-env"),
  );

  // Sort by dependency order
  const sorted = sortFiles(srcEntries);

  // Collect all CSS (index.css, any .css files)
  const cssFiles = Object.entries(files)
    .filter(([p]) => p.endsWith(".css"))
    .map(([, content]) => content)
    .join("\n");

  // Keep each file isolated as its own module to avoid symbol collisions.
  const codeFiles = Object.fromEntries(
    sorted.filter(([p]) => /\.[tj]sx?$/.test(p)),
  );

  const entryFile =
    Object.keys(codeFiles).find((p) => p === "src/App.tsx") ||
    Object.keys(codeFiles).find((p) => p === "src/App.jsx") ||
    Object.keys(codeFiles).find((p) => /\/App\.[tj]sx?$/.test(p)) ||
    "";

  const filesJson = JSON.stringify(codeFiles).replace(/<\//g, "<\\/");
  const entryJson = JSON.stringify(entryFile).replace(/<\//g, "<\\/");

  const innerCode = `
var React = window.React;
var ReactDOM = window.ReactDOM;
var __files = ${filesJson};
var __entry = ${entryJson};

/* ── Icon stub factory (Proxy) ── */
function __createIconStub(name) {
  var Icon = React.forwardRef(function(props, ref) {
    var p = props || {};
    var s = p.size || 24;
    return React.createElement("svg", {
      ref: ref,
      xmlns: "http://www.w3.org/2000/svg",
      width: s, height: s,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: p.color || "currentColor",
      strokeWidth: p.strokeWidth || 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: p.className,
      style: p.style,
      onClick: p.onClick,
      "aria-label": name
    });
  });
  Icon.displayName = name;
  return Icon;
}
var __iconProxy = new Proxy({}, {
  get: function(_, prop) {
    if (typeof prop === "symbol") return undefined;
    return __createIconStub(String(prop));
  }
});
var lucideIcons = (typeof lucideReact !== "undefined" && lucideReact && typeof lucideReact.Menu === "function")
  ? lucideReact
  : __iconProxy;

function __normalizePath(path) {
  var raw = (path || "").replace(/\\\\/g, "/");
  var parts = raw.split("/");
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var seg = parts[i];
    if (!seg || seg === ".") continue;
    if (seg === "..") {
      out.pop();
      continue;
    }
    out.push(seg);
  }
  return out.join("/");
}

function __dirname(path) {
  var normalized = __normalizePath(path);
  var idx = normalized.lastIndexOf("/");
  return idx >= 0 ? normalized.slice(0, idx) : "";
}

function __resolveCandidate(base) {
  var normalized = __normalizePath(base);
  if (__files[normalized]) return normalized;

  var withExt = [
    normalized + ".tsx",
    normalized + ".ts",
    normalized + ".jsx",
    normalized + ".js",
    normalized + "/index.tsx",
    normalized + "/index.ts",
    normalized + "/index.jsx",
    normalized + "/index.js",
  ];
  for (var i = 0; i < withExt.length; i++) {
    if (__files[withExt[i]]) return withExt[i];
  }

  return "";
}

function __resolveImport(fromPath, specifier) {
  if (!specifier) return "";

  if (specifier.startsWith("@/")) {
    return __resolveCandidate("src/" + specifier.slice(2));
  }

  if (specifier.startsWith("/")) {
    return __resolveCandidate(specifier.slice(1));
  }

  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    var fromDir = __dirname(fromPath);
    return __resolveCandidate(fromDir + "/" + specifier);
  }

  return "";
}

var __moduleCache = {};

function __require(specifier, fromPath) {
  if (specifier === "react") {
    return React;
  }
  if (specifier === "react-dom") {
    return ReactDOM;
  }
  if (specifier === "react-dom/client") {
    return {
      createRoot: ReactDOM.createRoot ? ReactDOM.createRoot.bind(ReactDOM) : function() {
        throw new Error("react-dom/client createRoot is unavailable in preview runtime.");
      },
    };
  }
  if (specifier === "lucide-react") {
    return lucideIcons;
  }
  if (specifier.endsWith(".css")) {
    return {};
  }

  var resolved = __resolveImport(fromPath, specifier);
  if (!resolved) {
    throw new Error("Cannot resolve module '" + specifier + "' from '" + fromPath + "'.");
  }
  return __executeModule(resolved);
}

function __executeModule(path) {
  var normalized = __normalizePath(path);
  if (__moduleCache[normalized]) {
    return __moduleCache[normalized].exports;
  }

  var source = __files[normalized];
  if (typeof source !== "string") {
    throw new Error("Module source not found for: " + normalized);
  }

  var module = { exports: {} };
  __moduleCache[normalized] = module;

  var transformed = Babel.transform(source, {
    filename: normalized,
    sourceType: "module",
    presets: [
      ["react", { runtime: "classic" }],
      ["typescript", { isTSX: true, allExtensions: true }],
    ],
    plugins: ["transform-modules-commonjs"],
  }).code;

  var localRequire = function(spec) {
    return __require(spec, normalized);
  };

  var fn = new Function(
    "require",
    "module",
    "exports",
    "React",
    "ReactDOM",
    "lucideIcons",
    transformed,
  );
  fn(localRequire, module, module.exports, React, ReactDOM, lucideIcons);
  return module.exports;
}

/* ── Error Boundary ── */
class __ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error: error };
  }
  componentDidCatch(error, info) {
    console.error("React render error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      var errMsg = this.state.error
        ? (this.state.error.message || String(this.state.error))
        : "Unknown render error";
      return React.createElement("div", {
        style: {
          padding: "24px",
          fontFamily: "ui-monospace, monospace",
          fontSize: "13px",
          color: "#fda4af",
          background: "#1e1e1e",
          minHeight: "100vh",
          whiteSpace: "pre-wrap"
        }
      },
        React.createElement("h2", { style: { color: "#f87171", marginBottom: "12px" } }, "Render Error"),
        errMsg,
        this.state.error && this.state.error.stack
          ? React.createElement("pre", { style: { marginTop: "12px", opacity: 0.7, fontSize: "11px" } }, this.state.error.stack)
          : null
      );
    }
    return this.props.children;
  }
}

/* ── Render ── */
var __rootEl = document.getElementById("root");
if (!__entry) {
  __rootEl.innerHTML = '<div style="padding:24px;color:#fda4af;font-family:monospace;background:#1e1e1e;min-height:100vh">No App entry file found (expected src/App.tsx).</div>';
} else {
  var __entryModule = __executeModule(__entry);
  var App = (__entryModule && (__entryModule.default || __entryModule.App)) || null;
  if (!App) {
    __rootEl.innerHTML = '<div style="padding:24px;color:#fda4af;font-family:monospace;background:#1e1e1e;min-height:100vh">App export not found in ' + __entry + '.</div>';
  } else {
  ReactDOM.createRoot(__rootEl).render(
    React.createElement(__ErrorBoundary, null, React.createElement(App))
  );
  }
}
`;

  // JSON.stringify for safe embedding inside <script>, then escape </script> in the JSON
  const codeJson = JSON.stringify(innerCode).replace(/<\//g, "<\\/");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script>${vendorScripts}<\/script>
  <style>
    html, body, #root { height: 100%; margin: 0; }
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #fff;
      color: #0f172a;
    }
    #error-display {
      color: #fda4af;
      padding: 16px;
      white-space: pre-wrap;
      font-family: ui-monospace, monospace;
      font-size: 13px;
      background: #1e1e1e;
      display: none;
    }
    #status-display {
      position: fixed;
      top: 8px;
      right: 8px;
      z-index: 9999;
      max-width: min(420px, calc(100vw - 16px));
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.92);
      color: #cbd5e1;
      padding: 8px 10px;
      font-family: ui-monospace, monospace;
      font-size: 11px;
      line-height: 1.5;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }
    ${cssFiles}
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="error-display"></div>
  <div id="status-display">Loading preview runtime…</div>
  <script>
    /* Global error handler — last resort */
    window.onerror = function(msg, src, line, col, err) {
      var el = document.getElementById("error-display");
      if (el) {
        el.style.display = "block";
        el.textContent = "Uncaught Error:\\n" + msg + (err && err.stack ? "\\n\\n" + err.stack : "");
      }
      return true;
    };

    (function() {
      var errorNode = document.getElementById("error-display");
      var statusNode = document.getElementById("status-display");
      function setStatus(message) {
        if (statusNode) {
          statusNode.textContent = message;
        }
      }
      function showError(label, err) {
        console.error(label, err);
        errorNode.style.display = "block";
        errorNode.textContent = label + "\\n" + (err instanceof Error ? err.message + "\\n\\n" + err.stack : String(err));
        setStatus(label + " " + (err && err.message ? err.message : String(err)));
      }

      var code = ${codeJson};

      function tryRun(attempt) {
        setStatus("Checking preview runtime… attempt " + (attempt + 1));
        if (typeof React !== "undefined" && typeof ReactDOM !== "undefined" && typeof Babel !== "undefined") {
          setStatus("Preview runtime ready. Rendering app…");
          runApp();
        } else if (attempt < 50) {
          setTimeout(function() { tryRun(attempt + 1); }, 100);
        } else {
          showError("Load Error:", "Required libraries (React, ReactDOM, or Babel) were not available inside the preview document.");
        }
      }

      function runApp() {
        try {
          setStatus("Transpiling generated code…");
          var result = Babel.transform(code, {
            presets: ["typescript", "react"],
            filename: "app.tsx"
          });
          console.log("[preview] Babel transform OK, output length:", result.code.length);
          setStatus("Executing app bundle…");
          (0, eval)(result.code);
          setTimeout(function() {
            if (__rootEl && __rootEl.innerHTML.trim()) {
              setStatus("Preview rendered successfully.");
            } else {
              setStatus("Render completed but root is empty.");
            }
          }, 150);
        } catch(err) {
          showError("Preview Error:", err);
        }
      }

      tryRun(0);
    })();
  <\/script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PreviewPanel({
  previewUrl,
  isLoading,
  loadingStatus,
  fallbackFiles,
  isFallback,
  isGenerating,
}: PreviewPanelProps) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeFailed, setIframeFailed] = useState(false);
  const [manualRefreshKey, setManualRefreshKey] = useState(0);
  const [vendorScripts, setVendorScripts] = useState("");
  const [vendorLoadError, setVendorLoadError] = useState("");

  // Reset iframe state when previewUrl changes; timeout → fall back
  useEffect(() => {
    if (!previewUrl) {
      setIframeLoaded(false);
      setIframeFailed(false);
      return;
    }
    setIframeLoaded(false);
    setIframeFailed(false);

    const timeout = setTimeout(() => {
      setIframeFailed(true);
      console.warn("[preview] iframe load timeout – falling back to inline preview");
    }, 5000);

    return () => clearTimeout(timeout);
  }, [previewUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadVendorScripts() {
      try {
        setVendorLoadError("");
        const [reactRes, reactDomRes, babelRes, tailwindRes] = await Promise.all([
          fetch("/vendor/react.development.js"),
          fetch("/vendor/react-dom.development.js"),
          fetch("/vendor/babel.min.js"),
          fetch("/vendor/tailwindcss.js"),
        ]);

        if (!reactRes.ok || !reactDomRes.ok || !babelRes.ok || !tailwindRes.ok) {
          throw new Error("Failed to load local preview runtime files.");
        }

        const [reactCode, reactDomCode, babelCode, tailwindCode] = await Promise.all([
          reactRes.text(),
          reactDomRes.text(),
          babelRes.text(),
          tailwindRes.text(),
        ]);

        if (cancelled) return;

        setVendorScripts(
          [reactCode, reactDomCode, babelCode, tailwindCode]
            .join("\n;\n")
            .replace(/<\//g, "<\\/"),
        );
      } catch (error) {
        if (cancelled) return;
        setVendorLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load preview runtime.",
        );
      }
    }

    loadVendorScripts();

    return () => {
      cancelled = true;
    };
  }, []);

  const srcDoc = useMemo(() => {
    if (!vendorScripts) return "";
    if (!fallbackFiles || Object.keys(fallbackFiles).length === 0) return "";
    const hasApp = Object.keys(fallbackFiles).some(
      (p) => p.includes("App.tsx") || p.includes("App.jsx"),
    );
    if (!hasApp) return "";
    console.log("[preview] buildSrcDoc: files=", Object.keys(fallbackFiles).join(", "));
    return buildSrcDoc(fallbackFiles, vendorScripts);
  }, [fallbackFiles, vendorScripts]);

  // ── Blob URL: avoids all srcDoc + sandbox + credentialless issues ──
  const [blobUrl, setBlobUrl] = useState("");
  useEffect(() => {
    if (!srcDoc) {
      setBlobUrl("");
      return;
    }
    const blob = new Blob([srcDoc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    console.log("[preview] Created blob URL:", url, "html length:", srcDoc.length);
    setBlobUrl(url);
    return () => {
      console.log("[preview] Revoking blob URL:", url);
      URL.revokeObjectURL(url);
    };
  }, [srcDoc, manualRefreshKey]);

  const previewKey = useMemo(
    () => `${manualRefreshKey}-${blobUrl}`,
    [manualRefreshKey, blobUrl],
  );

  // Always prefer blob URL inline preview when we have generated files.
  // The WebContainer iframe is unreliable (often loads blank) so disable it.
  const showInlinePreview = blobUrl.length > 0;
  const showWcIframe = false;

  function handleRefresh() {
    if (previewUrl && iframeRef.current) {
      iframeRef.current.src = previewUrl;
    } else {
      setManualRefreshKey((k) => k + 1);
    }
  }

  const deviceWidths: Record<DeviceMode, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  return (
    <div className="flex h-full flex-col bg-[#0d0d0d]">
      {/* Toolbar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[#2a2a2a] bg-[#111] px-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDeviceMode("desktop")}
            className={cn(
              "rounded p-1",
              deviceMode === "desktop"
                ? "text-sky-400"
                : "text-[#555] hover:text-[#a1a1a1]",
            )}
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode("tablet")}
            className={cn(
              "rounded p-1",
              deviceMode === "tablet"
                ? "text-sky-400"
                : "text-[#555] hover:text-[#a1a1a1]",
            )}
          >
            <Tablet className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setDeviceMode("mobile")}
            className={cn(
              "rounded p-1",
              deviceMode === "mobile"
                ? "text-sky-400"
                : "text-[#555] hover:text-[#a1a1a1]",
            )}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {showInlinePreview && !previewUrl && (
            <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-400">
              Live preview
            </span>
          )}
          {previewUrl && (
            <span className="max-w-[200px] truncate rounded bg-[#1a1a1a] px-2 py-0.5 text-[10px] text-[#666]">
              {previewUrl}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            className="rounded p-1 text-[#555] transition hover:text-[#a1a1a1]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-1 text-[#555] transition hover:text-[#a1a1a1]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Preview area */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {/* 0) Building animation while AI is generating */}
        {isGenerating ? (
          <div className="flex flex-col items-center gap-6">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full border-2 border-[#2a2a2a]" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-sky-400" />
            </div>
            <div className="text-center">
              <p className="text-[15px] font-medium text-white">
                Building your app...
              </p>
              <p className="mt-1 text-[12px] text-[#555]">
                This usually takes 10–20 seconds
              </p>
            </div>
            <div className="flex gap-1.5">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-2 w-2 animate-bounce rounded-full bg-sky-400"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        ) : vendorLoadError ? (
          <div className="max-w-lg px-6 text-center">
            <p className="text-sm font-medium text-red-400">
              Preview runtime failed to load
            </p>
            <p className="mt-2 text-xs text-[#777]">{vendorLoadError}</p>
          </div>
        ) : !vendorScripts ? (
          <div className="text-center">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-sky-400" />
            <p className="text-[12px] text-[#666]">Loading preview runtime...</p>
          </div>
        ) : /* 1) WebContainer dev-server iframe */ showWcIframe ? (
          <div
            className="relative h-full transition-all"
            style={{ width: deviceWidths[deviceMode], maxWidth: "100%" }}
          >
            <iframe
              ref={iframeRef}
              src={previewUrl!}
              className="h-full w-full border-0 bg-white"
              allow="cross-origin-isolated"
              // @ts-expect-error -- credentialless is a valid HTML attribute (Chrome 110+)
              credentialless="true"
              title="App Preview"
              onLoad={() => {
                setIframeLoaded(true);
                console.log("[preview] WC iframe loaded:", previewUrl);
              }}
              onError={(e) => {
                setIframeFailed(true);
                console.error("[preview] WC iframe error:", e);
              }}
            />
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0d0d0d]/80">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
                  <p className="text-[12px] text-[#666]">Loading preview...</p>
                </div>
              </div>
            )}
          </div>
        ) : /* 2) Inline blob URL preview */ showInlinePreview ? (
          <div
            className="h-full transition-all"
            style={{ width: deviceWidths[deviceMode], maxWidth: "100%" }}
          >
            <iframe
              key={previewKey}
              src={blobUrl}
              className="h-full w-full rounded-sm border-0 bg-white"
              title="App Preview"
              onLoad={() => console.log("[preview] Blob iframe loaded")}
              onError={(e) => console.error("[preview] Blob iframe error", e)}
            />
          </div>
        ) : (
          /* 3) Empty / loading state */
          <div className="text-center">
            {isLoading ? (
              <>
                <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-sky-400" />
                <p className="text-[12px] text-[#666]">{loadingStatus}</p>
              </>
            ) : (
              <>
                <p className="text-[13px] text-[#555]">
                  Preview will appear here
                </p>
                <p className="mt-1 text-[11px] text-[#444]">
                  Generate code to see the live preview
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
