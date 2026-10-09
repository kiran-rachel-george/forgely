"use client";

const TEMPLATES = [
  { icon: "🤖", label: "MoltBot", tag: "New" },
  { icon: "💬", label: "My Counter Part", tag: null },
  { icon: "📄", label: "Bill Generator", tag: null },
  { icon: "✨", label: "Word of the Day", tag: null },
  { icon: "📊", label: "Analytics Dashboard", tag: null },
  { icon: "🛒", label: "E-Commerce Store", tag: null },
];

interface TemplateSuggestionsProps {
  onSelect: (label: string) => void;
}

export function TemplateSuggestions({ onSelect }: TemplateSuggestionsProps) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      {TEMPLATES.map((t) => (
        <button
          key={t.label}
          onClick={() => onSelect(`Build me a ${t.label} app`)}
          className="flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#1a1a1a] px-3 py-1.5 text-[12px] text-[#999] transition hover:border-[#333] hover:text-white"
        >
          <span>{t.icon}</span>
          <span>{t.label}</span>
          {t.tag && (
            <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-medium text-sky-400">
              {t.tag}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
