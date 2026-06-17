import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/sections/section-heading";
import { company, values } from "@/lib/site-data";

export function AboutPreview() {
  return (
    <section className="container-px mx-auto max-w-7xl py-20 lg:py-28">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <Reveal direction="right">
          <div className="relative">
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-navy">
              <Image
                src="/images/about-factory.jpg"
                alt="A.J. Wires manufacturing floor"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/10 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 rounded-lg bg-navy/80 p-4 backdrop-blur-sm">
                <p className="font-heading text-sm font-semibold text-white">
                  Medchal, Hyderabad — Telangana
                </p>
                <p className="text-xs text-white/60">Two operating units: Godown & Office</p>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 hidden rounded-xl border border-border bg-card p-5 shadow-lg sm:block">
              <p className="font-heading text-2xl font-bold text-gold">10+</p>
              <p className="text-xs font-medium text-muted-foreground">Years in Business</p>
            </div>
          </div>
        </Reveal>

        <div>
          <SectionHeading
            align="left"
            eyebrow="About A.J. Wires"
            title="A Trusted Wire & Steel Partner, Built in Telangana"
            description={company.description}
            className="mx-0"
          />
          <ul className="mt-8 grid grid-cols-2 gap-4">
            {values.map((v) => (
              <li key={v.title} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-gold" />
                <span className="text-sm font-medium text-foreground">{v.title}</span>
              </li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-8 bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy dark:hover:bg-gold-light">
            <Link href="/about">
              More About Us <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
