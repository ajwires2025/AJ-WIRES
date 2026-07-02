import { ShieldCheck, Factory, PackageCheck, Truck } from "lucide-react";
import { SectionHeading } from "@/components/sections/section-heading";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { whyChooseUs } from "@/lib/site-data";

const icons = [ShieldCheck, Factory, PackageCheck, Truck];

export function WhyChooseUs() {
  return (
    <section className="container-px mx-auto max-w-7xl py-20 lg:py-28">
      <SectionHeading
        eyebrow="Why Choose Us"
        title="Quality and Reliability, Every Dispatch"
        description="From specification to delivery, every order is held to the same standard."
      />

      <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
        {whyChooseUs.map((item, i) => {
          const Icon = icons[i];
          return (
            <RevealItem key={item.title}>
              <TiltCard className="h-full rounded-2xl border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-lg">
                <div className="flex size-12 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-5 font-heading text-base font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </TiltCard>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}
