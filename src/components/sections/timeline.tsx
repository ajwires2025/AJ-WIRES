import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { timeline } from "@/lib/site-data";

export function Timeline() {
  return (
    <RevealGroup className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4" stagger={0.12}>
      <div className="absolute inset-x-0 top-6 hidden h-px bg-border lg:block" />
      {timeline.map((item, i) => (
        <RevealItem key={item.title} className="relative">
          <div className="relative flex flex-col">
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-navy font-heading text-sm font-bold text-gold dark:bg-gold dark:text-navy">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                {item.year}
              </span>
            </div>
            <h3 className="mt-4 font-heading text-lg font-bold text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {item.description}
            </p>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
