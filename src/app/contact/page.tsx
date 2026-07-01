import type { Metadata } from "next";
import { Phone, Mail, MapPin, FileBadge } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { SectionHeading } from "@/components/sections/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { company } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Contact Us — Medchal, Hyderabad",
  description:
    "Contact A.J. Wires in Medchal, Hyderabad — Godown at IDA Cherlapally and Office at Neredmet. Call, WhatsApp, or visit us for galvanized wire supply.",
  alternates: { canonical: "/contact" },
};

function mapEmbedUrl(query: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
}

export default function ContactPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <PageHero
        eyebrow="Contact Us"
        title="Visit, Call, or Write to Us"
        description="Two units in Medchal, Hyderabad — ready to discuss your next order."
      />

      <section className="container-px mx-auto max-w-7xl py-20 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Get in Touch"
              title="Reach the A.J. Wires Team"
              className="mx-0"
            />

            <div className="mt-8 space-y-5">
              <Reveal>
                <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                  <Phone className="mt-0.5 size-5 shrink-0 text-gold" />
                  <div>
                    <p className="font-heading text-sm font-bold text-foreground">Phone</p>
                    {company.phones.map((phone, i) => (
                      <p key={phone} className="text-sm text-muted-foreground">
                        <a href={`tel:${company.phonesRaw[i]}`} className="hover:text-gold">
                          {phone}
                        </a>
                      </p>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.05}>
                <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                  <Mail className="mt-0.5 size-5 shrink-0 text-gold" />
                  <div>
                    <p className="font-heading text-sm font-bold text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">
                      <a href={`mailto:${company.email}`} className="hover:text-gold">
                        {company.email}
                      </a>
                    </p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                  <FileBadge className="mt-0.5 size-5 shrink-0 text-gold" />
                  <div>
                    <p className="font-heading text-sm font-bold text-foreground">GSTIN</p>
                    <p className="text-sm text-muted-foreground">{company.gstin}</p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-gold" />
                  <div>
                    <p className="font-heading text-sm font-bold text-foreground">
                      {company.godown.label}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {company.godown.lines.join(" ")}
                    </p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.2}>
                <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-gold" />
                  <div>
                    <p className="font-heading text-sm font-bold text-foreground">
                      {company.office.label}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {company.office.lines.join(" ")}
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>

          <Reveal direction="left">
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
              <Tabs defaultValue="godown">
                <div className="border-b border-border p-4">
                  <TabsList className="w-full">
                    <TabsTrigger value="godown" className="flex-1">
                      Godown — IDA Cherlapally
                    </TabsTrigger>
                    <TabsTrigger value="office" className="flex-1">
                      Office — Neredmet
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="godown" className="m-0">
                  <iframe
                    title="A.J. Wires Godown Location"
                    src={mapEmbedUrl(
                      "Plot No.1A, Phase-4, IDA Cherlapally, Medchal 500051, Telangana"
                    )}
                    className="h-[420px] w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </TabsContent>
                <TabsContent value="office" className="m-0">
                  <iframe
                    title="A.J. Wires Office Location"
                    src={mapEmbedUrl("Kehava Nagar, Neredmet, Medchal 500056, Telangana")}
                    className="h-[420px] w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </TabsContent>
              </Tabs>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
