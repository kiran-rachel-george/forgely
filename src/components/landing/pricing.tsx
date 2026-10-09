import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const tiers = [
  {
    name: "Starter",
    price: "$0",
    subtitle: "For exploration",
    features: ["3 projects", "Basic prompt history", "Public preview links"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    subtitle: "Per month",
    features: ["Unlimited projects", "Version diff + restore", "Priority model queue", "Deploy shortcuts"],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$99",
    subtitle: "Per month",
    features: ["Shared workspaces", "Role-based access", "Project templates", "Audit logs"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <h2 className="text-2xl font-semibold text-slate-100 sm:text-3xl">Pricing</h2>
        <p className="mt-3 text-slate-400">Choose a plan that matches your build velocity.</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={tier.highlighted ? "border-cyan-400/40 bg-slate-900 shadow-cyan-900/30" : "border-slate-800 bg-slate-900/70"}
            >
              <CardHeader>
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <p className="mt-1 text-3xl font-semibold text-slate-100">{tier.price}</p>
                <p className="text-sm text-slate-400">{tier.subtitle}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="size-4 text-cyan-300" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 w-full" variant={tier.highlighted ? "default" : "secondary"}>
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
