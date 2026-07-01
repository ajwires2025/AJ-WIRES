import type { Metadata } from "next";
import { Phone, Mail, Clock } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { QuoteForm } from "@/components/sections/quote-form";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { company } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Get a Quote — Galvanized Wire Supply",
  description:
    "Request a quote for galvanized barbed wire, chain link fencing, or GI wire from A.J. Wires, Medchal, Hyderabad. Tell us your specification and we'll respond promptly.",
  alternates: { canonical: "/quote" },
};

export default function QuotePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Request a Quote", path: "/quote" },
        ])}
      />
      <PageHero
        eyebrow="Request a Quote"
        title="Tell Us What You Need — We'll Take It From There"
        description="Share your product, gauge, quantity, and delivery location. Our team will respond with pricing and a dispatch timeline."
      />

      <section className="container-px mx-auto max-w-5xl py-20 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <Phone className="size-5 text-gold" />
                <h3 className="font-heading text-sm font-bold text-foreground">Call Us</h3>
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {company.phones.map((phone, i) => (
                  <p key={phone}>
                    <a href={`tel:${company.phonesRaw[i]}`} className="hover:text-gold">
                      {phone}
                    </a>
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <Mail className="size-5 text-gold" />
                <h3 className="font-heading text-sm font-bold text-foreground">Email Us</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                <a href={`mailto:${company.email}`} className="hover:text-gold">
                  {company.email}
                </a>
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <Clock className="size-5 text-gold" />
                <h3 className="font-heading text-sm font-bold text-foreground">Response Time</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                We typically respond to quote requests within one business day.
              </p>
            </div>
          </div>

          <QuoteForm />
        </div>
      </section>
    </>
  );
}
