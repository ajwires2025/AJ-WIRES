import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/sections/section-heading";
import { ProductIcon } from "@/components/sections/product-icon";
import { RevealGroup, RevealItem } from "@/components/motion/reveal";
import { products } from "@/lib/site-data";

export function ProductsPreview() {
  return (
    <section className="bg-secondary/40 py-20 lg:py-28">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="What We Supply"
          title="Engineered for Strength, Built to Specification"
          description="Four core product lines — manufactured, sourced, and packed to your exact requirement."
        />

        <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {products.map((product) => (
            <RevealItem key={product.slug}>
              <Link
                href="/products"
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-xl hover:shadow-gold/5"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex size-10 items-center justify-center rounded-lg bg-gold text-navy">
                    <ProductIcon icon={product.icon} className="size-5" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-heading text-lg font-bold text-foreground">
                    {product.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {product.tagline}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-gold opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    View details <ArrowUpRight className="size-3.5" />
                  </span>
                </div>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="mt-12 flex justify-center">
          <Button asChild size="lg" variant="outline" className="border-gold/40 hover:bg-gold/10">
            <Link href="/products">
              View All Products <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
