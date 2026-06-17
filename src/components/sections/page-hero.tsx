import { ChainLinkPattern } from "@/components/visuals/wire-pattern";
import { Reveal } from "@/components/motion/reveal";

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-navy pt-32 pb-16 lg:pt-40 lg:pb-20">
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy to-navy-light" />
      <ChainLinkPattern className="pointer-events-none absolute inset-0 size-full text-white/[0.07]" />
      <div className="container-px relative mx-auto max-w-7xl">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light">
            <span className="size-1.5 rounded-full bg-gold" />
            {eyebrow}
          </span>
          <h1 className="mt-5 max-w-3xl font-heading text-4xl font-bold leading-tight tracking-tight text-white text-balance sm:text-5xl">
            {title}
          </h1>
          {description && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              {description}
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
