import { SectionHeading } from "@/components/sections/section-heading";
import { Reveal } from "@/components/motion/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/lib/site-data";

export function FaqSection() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="container-px mx-auto max-w-4xl py-20 lg:py-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SectionHeading
        eyebrow="FAQs"
        title="Common Questions, Answered"
        description="Everything you need to know before you order — if it's not here, just ask."
      />
      <Reveal className="mt-12">
        <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-6">
          {faqs.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger className="py-5 font-heading text-base font-bold text-foreground">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
