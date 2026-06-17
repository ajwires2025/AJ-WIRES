import type { Metadata } from "next";
import { ClipboardCheck, FlaskConical, Droplets, Ruler, PackageSearch } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionHeading } from "@/components/sections/section-heading";
import { QualityBar } from "@/components/sections/quality-bar";
import { CtaBanner } from "@/components/sections/cta-banner";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { qualityMetrics, qualityChecks } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Quality",
  description:
    "Quality You Can Specify — hot dip galvanizing, consistent quality checks, bulk supply readiness, safe packing, and timely delivery from A.J. Wires.",
  alternates: { canonical: "/quality" },
};

const checkIcons = [ClipboardCheck, FlaskConical, Droplets, Ruler, PackageSearch];

export default function QualityPage() {
  return (
    <>
      <PageHero
        eyebrow="Quality"
        title="Quality You Can Specify"
        description="Every coil, roll, and bundle is held to the same checkpoints — so what you order is exactly what you receive."
      />

      <section className="container-px mx-auto max-w-7xl py-20 lg:py-28">
        <SectionHeading
          eyebrow="Our Standard"
          title="Six Commitments, Every Order"
          description="These aren't aspirations — they're checked at every stage of production and dispatch."
        />
        <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
          {qualityMetrics.map((metric) => (
            <QualityBar
              key={metric.label}
              label={metric.label}
              value={metric.value}
              description={metric.description}
            />
          ))}
        </RevealGroup>
      </section>

      <section className="bg-secondary/40 py-20 lg:py-28">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Quality Checkpoints"
            title="Checked at Every Stage of Production"
            description="From raw material to pre-dispatch inspection, every batch passes through these checkpoints."
          />
          <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-5" stagger={0.08}>
            {qualityChecks.map((check, i) => {
              const Icon = checkIcons[i];
              return (
                <RevealItem key={check.title}>
                  <div className="flex h-full flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-navy text-gold dark:bg-gold dark:text-navy">
                      <Icon className="size-6" />
                    </div>
                    <h3 className="font-heading text-sm font-bold text-foreground">
                      {check.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {check.description}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
