import { Counter } from "@/components/motion/counter";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { stats } from "@/lib/site-data";

export function Stats() {
  return (
    <section className="relative border-b border-border bg-card">
      <div className="container-px mx-auto max-w-7xl py-12">
        <RevealGroup className="grid grid-cols-2 gap-8 sm:grid-cols-4" stagger={0.12}>
          {stats.map((stat) => (
            <RevealItem key={stat.label} className="text-center">
              <div className="font-heading text-3xl font-bold text-navy sm:text-4xl lg:text-5xl dark:text-gold">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:text-sm">
                {stat.label}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
