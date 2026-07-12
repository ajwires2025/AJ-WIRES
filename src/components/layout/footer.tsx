import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MapPin, ArrowUpRight } from "lucide-react";
import { company, navLinks, products } from "@/lib/site-data";
import { ChainLinkPattern } from "@/components/visuals/wire-pattern";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-navy text-white">
      <ChainLinkPattern className="pointer-events-none absolute inset-0 size-full text-white/40" />
      <div className="container-px relative mx-auto max-w-7xl py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="relative flex size-10 shrink-0 items-center justify-center">
                <Image src="/logo-mark-white.png" alt="" fill className="object-contain" />
              </span>
              <span className="font-heading text-xl font-bold tracking-[0.04em]">
                <span className="text-gold">AJ</span> WIRES
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">
              {company.description}
            </p>
            <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-gold">
              GSTIN: {company.gstin}
            </p>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">
              Products
            </h3>
            <ul className="mt-4 space-y-2.5">
              {products.map((p) => (
                <li key={p.slug}>
                  <Link
                    href="/products"
                    className="text-sm text-white/70 transition-colors hover:text-gold"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              {company.phones.map((phone, i) => (
                <li key={phone} className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 size-4 shrink-0 text-gold" />
                  <a href={`tel:${company.phonesRaw[i]}`} className="hover:text-gold">
                    {phone}
                  </a>
                </li>
              ))}
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-gold" />
                <a href={`mailto:${company.email}`} className="hover:text-gold">
                  {company.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
                <span>{company.office.lines[0]} {company.office.lines[2]}</span>
              </li>
            </ul>
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold hover:underline"
            >
              View full address <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} A.J. Wires. All rights reserved.</p>
          <p>Manufacturer &amp; Trader — Medchal, Hyderabad, Telangana, India</p>
          <Link href="/accounts/login" className="hover:text-gold">
            Staff Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
