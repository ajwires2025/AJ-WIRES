import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { ProductCardFull } from "@/components/sections/product-card-full";
import { CtaBanner } from "@/components/sections/cta-banner";
import { RevealGroup } from "@/components/motion/reveal";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { products, company } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "GI Wire, Barbed Wire & Chain Link Fencing",
  description:
    "Galvanized Barbed Wire, Chain Link Fencing, and GI Wire — manufactured to spec with hot dip galvanizing for agriculture, industrial, security, and project applications.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.map((product, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: product.name,
        description: product.description,
        image: `${company.url}${product.image}`,
        url: `${company.url}/products`,
        brand: { "@type": "Brand", name: "A.J. Wires" },
      },
    })),
  };

  return (
    <>
      <JsonLd data={itemListJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
        ])}
      />
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
