import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { ProductCardFull } from "@/components/sections/product-card-full";
import { CtaBanner } from "@/components/sections/cta-banner";
import { RevealGroup } from "@/components/motion/reveal";
import { products } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Products | GI Wire, Barbed Wire & Chain Link Fencing",
  description:
    "Galvanized Barbed Wire, Chain Link Fencing, GI Wire, and Steel — manufactured to spec with hot dip galvanizing for agriculture, industrial, security, and project applications.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Products"
        title="Four Product Lines. One Standard of Strength."
        description="Every product is manufactured or sourced to your exact gauge, finish, and quantity — ready for agriculture, security, infrastructure, and industrial projects."
      />

      <section className="container-px mx-auto max-w-7xl py-20 lg:py-28">
        <RevealGroup className="flex flex-col gap-10">
          {products.map((product, i) => (
            <ProductCardFull key={product.slug} product={product} reverse={i % 2 === 1} />
          ))}
        </RevealGroup>
      </section>

      <CtaBanner />
    </>
  );
}
