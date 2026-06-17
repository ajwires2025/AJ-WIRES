"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { company } from "@/lib/site-data";

export function WhatsAppFloat() {
  const whatsappHref = `https://wa.me/${company.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hi A.J. Wires, I'd like to request a quote."
  )}`;

  return (
    <motion.a
      href={whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200, damping: 15 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-22 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 sm:bottom-6 sm:right-6"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] motion-safe:animate-ping motion-safe:opacity-40" />
      <MessageCircle className="relative size-7" fill="white" />
    </motion.a>
  );
}
