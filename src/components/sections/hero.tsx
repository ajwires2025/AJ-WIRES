"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Compass, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChainLinkPattern, BarbedWireLine } from "@/components/visuals/wire-pattern";

export function Hero() {
  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-navy pt-24 lg:pt-16">
      <Image
        src="/images/hero-factory.jpg"
        alt=""
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-navy/95 via-navy/90 to-navy-light/85" />
      <ChainLinkPattern className="pointer-events-none absolute inset-0 size-full text-white/[0.07]" />

      {Array.from({ length: 5 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-gold/40"
          style={{
            width: 3 + (i % 3),
            height: 3 + (i % 3),
            left: `${12 + i * 18}%`,
            top: `${20 + (i % 3) * 22}%`,
          }}
          animate={{ y: [0, -22, 0], opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
        />
      ))}

      <div className="absolute inset-x-0 bottom-0 text-gold/20">
        <BarbedWireLine className="h-6 w-full" />
      </div>

      <div className="container-px relative mx-auto grid max-w-7xl items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light"
          >
            <ShieldCheck className="size-3.5" /> Manufacturer &amp; Trader · Medchal, Hyderabad
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 font-heading text-5xl font-bold leading-[1.05] tracking-tight text-white text-balance sm:text-6xl lg:text-7xl"
          >
            A.J. <span className="text-gold">Wires</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-3 font-heading text-lg font-medium text-gold-light sm:text-xl"
          >
            Galvanized Strength. Made to Spec. Built to Hold.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg"
          >
            Galvanized Barbed Wire, Chain Link Fencing, GI Wire &amp; Steel Solutions —
            manufactured and supplied from Medchal, Hyderabad for agriculture, infrastructure,
            security, industrial, and project applications across India.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-9 flex flex-col gap-4 sm:flex-row"
          >
            <Button asChild size="lg" className="bg-gold text-navy hover:bg-gold-light">
              <Link href="/quote">
                Request a Quote <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/5 text-white hover:bg-white/15 hover:text-white"
            >
              <Link href="/products">
                <Compass className="size-4" /> Explore Products
              </Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative hidden aspect-square items-center justify-center lg:flex"
        >
          <div className="relative size-[26rem]">
            <div className="absolute inset-0 animate-spin-slow rounded-full border border-white/10" />
            <div className="absolute inset-6 rounded-full border border-dashed border-white/10" />
            <div className="absolute inset-12 rounded-full border border-white/10" />
            {Array.from({ length: 8 }).map((_, i) => {
              const r = 17.5;
              const angle = (i / 8) * Math.PI * 2;
              return (
                <span
                  key={i}
                  className="absolute size-2 rounded-full bg-gold"
                  style={{
                    left: `calc(50% + ${Math.cos(angle) * r}rem)`,
                    top: `calc(50% + ${Math.sin(angle) * r}rem)`,
                  }}
                />
              );
            })}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-44 flex-col items-center justify-center rounded-full bg-gold/10 text-center backdrop-blur-sm">
                <span className="font-heading text-4xl font-bold text-gold">100%</span>
                <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/70">
                  Galvanized
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
