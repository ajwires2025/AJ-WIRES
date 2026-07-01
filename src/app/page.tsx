import type { Metadata } from "next";
import { Hero } from "@/components/sections/hero";
import { Stats } from "@/components/sections/stats";
import { AboutPreview } from "@/components/sections/about-preview";
import { ProductsPreview } from "@/components/sections/products-preview";
import { WhyChooseUs } from "@/components/sections/why-choose-us";
import { SectionHeading } from "@/components/sections/section-heading";
import { ApplicationsGrid } from "@/components/sections/applications-grid";
import { FaqSection } from "@/components/sections/faq-section";
import { CtaBanner } from "@/components/sections/cta-banner";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <AboutPreview />
      <ProductsPreview />
      <WhyChooseUs />
      <section className="bg-secondary/40 py-20 lg:py-28">
        <div className="container-px mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Where We Supply"
            title="Trusted Across Every Application"
            description="From farmland to highways, our galvanized products hold the line."
          />
          <div className="mt-14">
            <ApplicationsGrid limit={10} />
          </div>
        </div>
      </section>
      <FaqSection />
      <CtaBanner />
    </>
  );
}
