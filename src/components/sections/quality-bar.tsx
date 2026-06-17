"use client";

import { motion } from "framer-motion";
import { RevealItem } from "@/components/motion/reveal";

export function QualityBar({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <RevealItem>
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-baseline justify-between">
          <h3 className="font-heading text-base font-bold text-foreground">{label}</h3>
          <span className="font-heading text-lg font-bold text-gold">{value}%</span>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
            initial={{ width: 0 }}
            whileInView={{ width: `${value}%` }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.2, ease: [0.21, 0.47, 0.32, 0.98] }}
          />
        </div>
      </div>
    </RevealItem>
  );
}
