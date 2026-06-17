import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import { ChainLinkPattern } from "@/components/visuals/wire-pattern";
import { company } from "@/lib/site-data";

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-navy py-20">
      <ChainLinkPattern className="pointer-events-none absolute inset-0 size-full text-white/30" />
      <div className="absolute -right-24 -top-24 size-96 rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-gold/10 blur-3xl" />
      <div className="container-px relative mx-auto max-w-4xl text-center">
        <Reveal>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Specify Your Next Order?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/70 sm:text-lg">
            Tell us your gauge, finish, and quantity — we&apos;ll get back with a tailored quote
            and dispatch timeline.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="bg-gold text-navy hover:bg-gold-light">
              <Link href="/quote">
                Request a Quote <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <a href={`tel:${company.phonesRaw[0]}`}>
                <Phone className="size-4" /> {company.phones[0]}
              </a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
