"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { galleryCategories, galleryItems, type GalleryItem } from "@/lib/site-data";

const heights = ["aspect-[4/5]", "aspect-square", "aspect-[5/4]", "aspect-[4/6]"];

export function GalleryGrid() {
  const [activeCategory, setActiveCategory] = React.useState<(typeof galleryCategories)[number]>(
    "All"
  );
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  const filtered = React.useMemo(
    () =>
      activeCategory === "All"
        ? galleryItems
        : galleryItems.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  const openLightbox = (item: GalleryItem) => {
    setLightboxIndex(filtered.findIndex((i) => i.id === item.id));
  };

  const closeLightbox = () => setLightboxIndex(null);

  const step = (delta: number) => {
    setLightboxIndex((prev) => {
      if (prev === null) return prev;
      const next = (prev + delta + filtered.length) % filtered.length;
      return next;
    });
  };

  const activeItem = lightboxIndex !== null ? filtered[lightboxIndex] : null;

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2.5">
        {galleryCategories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
              activeCategory === category
                ? "border-gold bg-gold text-navy"
                : "border-border bg-card text-muted-foreground hover:border-gold/40 hover:text-foreground"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3">
        {filtered.map((item, i) => (
          <motion.button
            key={item.id}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: (i % 6) * 0.05 }}
            onClick={() => openLightbox(item)}
            className={cn(
              "group relative mb-5 block w-full overflow-hidden rounded-2xl bg-navy text-left",
              heights[i % heights.length]
            )}
          >
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <span className="inline-flex rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-light">
                {item.category}
              </span>
              <p className="mt-1.5 font-heading text-sm font-bold text-white">{item.title}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {activeItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4 sm:p-8"
            onClick={closeLightbox}
          >
            <button
              aria-label="Close"
              onClick={closeLightbox}
              className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
            <button
              aria-label="Previous"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              className="absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-6"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              aria-label="Next"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-6"
            >
              <ChevronRight className="size-6" />
            </button>

            <motion.div
              key={activeItem.id}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex aspect-[4/3] w-full max-w-2xl flex-col items-center justify-center overflow-hidden rounded-2xl bg-navy"
            >
              <Image src={activeItem.image} alt={activeItem.title} fill className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy via-navy/40 to-transparent p-6 pt-16">
                <span className="inline-flex rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-light">
                  {activeItem.category}
                </span>
                <p className="mt-1.5 font-heading text-lg font-bold text-white">
                  {activeItem.title}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
