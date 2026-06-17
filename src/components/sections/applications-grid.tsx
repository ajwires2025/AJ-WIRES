import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { ApplicationIcon } from "@/components/sections/application-icon";
import { applications } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export function ApplicationsGrid({ limit, className }: { limit?: number; className?: string }) {
  const items = limit ? applications.slice(0, limit) : applications;
  return (
    <RevealGroup
      className={cn("grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5", className)}
      stagger={0.06}
    >
      {items.map((app) => (
        <RevealItem key={app.title}>
          <div className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-lg">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-navy text-gold transition-transform duration-300 group-hover:scale-110 dark:bg-gold dark:text-navy">
              <ApplicationIcon icon={app.icon} className="size-7" />
            </div>
            <p className="font-heading text-sm font-bold text-foreground">{app.title}</p>
          </div>
        </RevealItem>
      ))}
    </RevealGroup>
  );
}
