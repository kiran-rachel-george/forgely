import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    quote:
      "We went from prompt to usable product demo in under 10 minutes. The live edit + preview workflow feels like magic.",
    name: "Priya S.",
    role: "Indie founder",
  },
  {
    quote:
      "Version history plus chat iteration made it practical for real team workflows, not just novelty demos.",
    name: "Marcus L.",
    role: "Engineering manager",
  },
  {
    quote:
      "The generated components are clean enough that our devs can immediately extend and ship features.",
    name: "Elena R.",
    role: "Product designer",
  },
];

export function Testimonials() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <h2 className="text-2xl font-semibold text-slate-100 sm:text-3xl">Loved by builders</h2>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="border-slate-800 bg-slate-900/60">
              <CardContent className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-slate-300">“{testimonial.quote}”</p>
                <div>
                  <p className="text-sm font-medium text-slate-100">{testimonial.name}</p>
                  <p className="text-xs text-slate-500">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
