import { Braces, History, MessageSquareText, PanelRightOpen } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Prompt-to-App",
    description: "Turn natural language into a full React component with polished Tailwind UI.",
    icon: Braces,
  },
  {
    title: "Live Split Preview",
    description: "Edit with Monaco on the left and see live output in a sandboxed iframe on the right.",
    icon: PanelRightOpen,
  },
  {
    title: "Chat Iteration",
    description: "Keep refining with follow-up instructions while preserving conversation context.",
    icon: MessageSquareText,
  },
  {
    title: "Version Control",
    description: "Every generation is versioned. Compare diffs, restore previous states, and undo fast.",
    icon: History,
  },
];

export function Features() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <h2 className="text-2xl font-semibold text-slate-100 sm:text-3xl">Built for shipping fast</h2>
        <p className="mt-3 max-w-2xl text-slate-400">
          AI-first scaffolding with code ownership and developer workflows included from day one.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} className="border-slate-800 bg-slate-900/60">
                <CardHeader>
                  <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-200">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
