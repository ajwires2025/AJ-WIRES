import Link from "next/link";
import { Phone, FileText } from "lucide-react";
import { company } from "@/lib/site-data";

export function StickyMobileBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-border bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:hidden">
      <a
        href={`tel:${company.phonesRaw[0]}`}
        className="flex items-center justify-center gap-2 border-r border-border py-3.5 text-sm font-semibold text-foreground"
      >
        <Phone className="size-4" /> Call Now
      </a>
      <Link
        href="/quote"
        className="flex items-center justify-center gap-2 bg-gold py-3.5 text-sm font-semibold text-navy"
      >
        <FileText className="size-4" /> Request Quote
      </Link>
    </div>
  );
}
