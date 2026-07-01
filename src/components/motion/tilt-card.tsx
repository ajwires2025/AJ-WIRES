"use client";

import * as React from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  liftOnHover?: boolean;
};

export function TiltCard({
  children,
  className,
  maxTilt = 10,
  liftOnHover = true,
}: TiltCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { stiffness: 200, damping: 20, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothX, [0, 1], [-maxTilt, maxTilt]);
  const translateZ = useTransform(
    smoothX,
    [0, 0.5, 1],
    liftOnHover ? [0, 12, 0] : [0, 0, 0]
  );
  const glowX = useTransform(smoothX, [0, 1], ["0%", "100%"]);
  const glowY = useTransform(smoothY, [0, 1], ["0%", "100%"]);
  const glowBackground = useMotionTemplate`radial-gradient(circle at ${glowX} ${glowY}, color-mix(in oklch, var(--gold) 18%, transparent), transparent 60%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000 }}
      className={cn("group relative", className)}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          translateZ,
          transformStyle: "preserve-3d",
        }}
        className="relative size-full"
      >
        {children}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: glowBackground }}
        />
      </motion.div>
    </motion.div>
  );
}
