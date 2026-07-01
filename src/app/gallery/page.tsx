import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { GalleryGrid } from "@/components/sections/gallery-grid";
import { CtaBanner } from "@/components/sections/cta-banner";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Factory & Product Gallery — Medchal, Hyderabad",
  description:
    "Browse A.J. Wires' factory, products, GI wire, chain link, barbed wire, packing, dispatch, and project gallery from Medchal, Hyderabad.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Gallery", path: "/gallery" },
        ])}
      />
      <PageHero
        eyebrow="Gallery"
        title="Inside Our Factory & Dispatch Floor"
        description="A look at our manufacturing, products, packing, and project installations."
      />

      <section className="container-px mx-auto max-w-7xl py-20 lg:py-28">
        <GalleryGrid />
      </section>

      <CtaBanner />
    </>
  );
}
