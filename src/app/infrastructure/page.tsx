import type { Metadata } from "next";
import Image from "next/image";
import { Workflow, Droplets, Factory, PackageCheck, Warehouse, Truck } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionHeading } from "@/components/sections/section-heading";
import { CtaBanner } from "@/components/sections/cta-banner";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { infrastructureSteps } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Infrastructure",
  description:
    "From wire drawing and hot dip galvanizing to packing, storage, and dispatch — see how A.J. Wires manufactures and moves product from Medchal, Hyderabad.",
  alternates: { canonical: "/infrastructure" },
};

const icons = [Workflow, Droplets, Factory, PackageCheck, Warehouse, Truck];

export default function InfrastructurePage() {
  return (
    <>
      <PageHero
        eyebrow="Infrastructure"
        title="From Raw Wire to Ready Dispatch"
        description="A complete in-house process — drawing, galvanizing, manufacturing, packing, storage, and dispatch — run from our Medchal units."
      />

      <section className="container-px mx-auto max-w-7xl py-20 lg:py-28">
        <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
          {infrastructureSteps.map((step, i) => {
            const Icon = icons[i];
            return (
              <RevealItem key={step.title}>
                <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
                  <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-navy">
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/20 to-navy/40" />
                    <span className="absolute left-4 top-4 font-heading text-xs font-bold uppercase tracking-wider text-gold/80">
                      Step {String(i + 1).padStart(2, "0")}
                    </span>
                    <Icon className="absolute size-12 text-gold/90 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </section>

      <section className="bg-secondary/40 py-20 lg:py-28">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Built for Volume"
            title="Capacity to Support Project-Scale Orders"
            description="Our Medchal units are organized for continuous production and dispatch — keeping large and recurring orders moving on schedule."
          />
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
