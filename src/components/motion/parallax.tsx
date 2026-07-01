"use client";

import * as React from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

type ParallaxProps = {
  children: React.ReactNode;
  className?: string;
  speed?: number;
};

export function Parallax({ children, className, speed = 0.3 }: ParallaxProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [`${-speed * 100}px`, `${speed * 100}px`]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <motion.div style={{ y }} className="size-full">
        {children}
      </motion.div>
    </div>
  );
}

export function useParallaxY(speed = 0.3): MotionValue<string> {
  const { scrollY } = useScroll();
  return useTransform(scrollY, [0, 1000], ["0px", `${speed * 1000}px`]);
}
