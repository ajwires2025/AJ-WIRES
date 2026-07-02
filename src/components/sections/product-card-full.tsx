import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RevealItem } from "@/components/motion/reveal";
import { TiltCard } from "@/components/motion/tilt-card";
import { ProductIcon } from "@/components/sections/product-icon";
import { ProductSizeGallery } from "@/components/sections/product-size-gallery";
import type { Product } from "@/lib/site-data";

export function ProductCardFull({ product, reverse = false }: { product: Product; reverse?: boolean }) {
  return (
    <RevealItem direction={reverse ? "left" : "right"}>
      <div
        className={`grid grid-cols-1 items-center gap-10 rounded-3xl border border-border bg-card p-8 transition-shadow duration-300 hover:shadow-xl lg:grid-cols-[0.85fr_1.15fr] lg:p-12 ${
          reverse ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        <TiltCard maxTilt={6} className="aspect-square overflow-hidden rounded-2xl bg-navy">
          <div className="relative flex size-full items-center justify-center">
            <Image src={product.image} alt={product.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/10 to-transparent" />
            <div className="absolute bottom-4 left-4 flex size-12 items-center justify-center rounded-xl bg-gold text-navy">
              <ProductIcon icon={product.icon} className="size-6" />
            </div>
          </div>
        </TiltCard>

        <div>
          <h3 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">
            {product.name}
          </h3>
          <p className="mt-2 text-base text-gold">{product.tagline}</p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {product.specs.map((spec) => (
              <div key={spec.label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {spec.label}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {spec.values.map((v) => (
                    <Badge key={v} variant="secondary" className="font-medium">
                      {v}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Applications
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {product.applications.map((a) => (
                <Badge
                  key={a}
                  className="border-gold/30 bg-gold/10 font-medium text-gold-light dark:text-gold"
                  variant="outline"
                >
                  {a}
                </Badge>
              ))}
            </div>
          </div>

          {product.sizeGallery && <ProductSizeGallery items={product.sizeGallery} />}

          <Button asChild className="mt-7 bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy dark:hover:bg-gold-light">
            <Link href="/quote">
              Request a Quote <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </RevealItem>
  );
}
