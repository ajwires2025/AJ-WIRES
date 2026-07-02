import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2, Target, Eye } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionHeading } from "@/components/sections/section-heading";
import { Timeline } from "@/components/sections/timeline";
import { WhyChooseUs } from "@/components/sections/why-choose-us";
import { CtaBanner } from "@/components/sections/cta-banner";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { company, values, visionMission } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Galvanized Wire Manufacturer in Medchal, Hyderabad",
  description:
    "A.J. Wires is a Medchal, Hyderabad based manufacturer and trader of galvanized barbed wire, chain link fencing, and GI wire products — manufacturing, trading, and supplying projects across Telangana and India.",
  alternates: { canonical: "/about" },
};

const icons = [Target, Eye];

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <PageHero
        eyebrow="About A.J. Wires"
        title="A Manufacturing & Trading Partner Built on Reliability"
        description="Two units in Medchal, Hyderabad. One standard of quality across every product we ship."
      />

      <section className="container-px mx-auto max-w-7xl py-20 lg:py-28">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <Reveal direction="right">
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-navy">
              <Image
                src="/images/AJ-Wires-Hot-Dipped-Galvanized-Wire.png"
                alt="Galvanized wire close-up"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/10 to-transparent" />
            </div>
          </Reveal>
          <div>
            <SectionHeading
              align="left"
              eyebrow="Company Profile"
              title="Manufactured, Sourced, and Dispatched to Specification"
              className="mx-0"
            />
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              {company.description}
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              We manufacture, source, pack, and dispatch products tailored to customer
              specifications for agriculture, industrial, infrastructure, security, and project
              requirements. Our commitment to quality, galvanized protection, and dependable
              supply makes us a trusted partner across Telangana and India.
            </p>
            <ul className="mt-7 grid grid-cols-2 gap-4">
              {values.map((v) => (
                <li key={v.title} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-gold" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{v.title}</p>
                    <p className="text-xs text-muted-foreground">{v.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-secondary/40 py-20 lg:py-28">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading eyebrow="Our Journey" title="Growing With Telangana's Industry" />
          <div className="mt-14">
            <Timeline />
          </div>
        </div>
      </section>

      <section className="container-px mx-auto max-w-7xl py-20 lg:py-28">
        <SectionHeading eyebrow="Purpose" title="Vision & Mission" />
        <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2" stagger={0.12}>
          {visionMission.map((item, i) => {
            const Icon = icons[i];
            return (
              <RevealItem key={item.title}>
                <div className="h-full rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-navy text-gold dark:bg-gold dark:text-navy">
                    <Icon className="size-6" />
                  </div>
                  <h3 className="mt-5 font-heading text-xl font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </section>

      <WhyChooseUs />
      <CtaBanner />
    </>
  );
}
