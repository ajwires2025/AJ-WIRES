import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { ApplicationsGrid } from "@/components/sections/applications-grid";
import { CtaBanner } from "@/components/sections/cta-banner";

export const metadata: Metadata = {
  title: "Applications",
  description:
    "A.J. Wires products serve agriculture, industrial perimeters, security fencing, boundary walls, solar projects, highways, railways, sports grounds, warehouses, and infrastructure projects.",
  alternates: { canonical: "/applications" },
};

export default function ApplicationsPage() {
  return (
    <>
      <PageHero
        eyebrow="Applications"
        title="Built to Hold, Wherever You Need It"
        description="Our galvanized barbed wire, chain link fencing, GI wire, and steel serve a wide range of agricultural, industrial, and infrastructure applications across India."
      />

      <section className="container-px mx-auto max-w-7xl py-20 lg:py-28">
        <ApplicationsGrid />
      </section>

      <CtaBanner />
    </>
  );
}
