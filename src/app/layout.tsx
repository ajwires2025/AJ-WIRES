import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { StickyMobileBar } from "@/components/layout/sticky-mobile-bar";
import { Toaster } from "@/components/ui/sonner";
import { company } from "@/lib/site-data";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const siteUrl = company.url;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "A.J. Wires | GI Wire, Barbed Wire & Chain Link Fence Manufacturer, Hyderabad",
    template: "%s | A.J. Wires",
  },
  description:
    "A.J. Wires is a Medchal, Hyderabad based manufacturer and trader of galvanized barbed wire, chain link fencing, GI wire, and steel — supplying agriculture, infrastructure, security, and industrial projects across Telangana and India.",
  keywords: [
    "GI Wire Manufacturer Hyderabad",
    "Barbed Wire Manufacturer Hyderabad",
    "Chain Link Fence Manufacturer Hyderabad",
    "GI Wire Supplier Telangana",
    "Galvanized Wire India",
    "Steel Supplier Hyderabad",
    "Barbed Wire Medchal",
    "Chain Link Fencing Telangana",
  ],
  authors: [{ name: "A.J. Wires" }],
  creator: "A.J. Wires",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "A.J. Wires",
    title: "A.J. Wires | Galvanized Strength. Made to Spec. Built to Hold.",
    description:
      "Manufacturer and trader of galvanized barbed wire, chain link fencing, GI wire, and steel — from Medchal, Hyderabad to projects across India.",
  },
  twitter: {
    card: "summary_large_image",
    title: "A.J. Wires | Galvanized Strength. Made to Spec. Built to Hold.",
    description:
      "Manufacturer and trader of galvanized barbed wire, chain link fencing, GI wire, and steel from Medchal, Hyderabad.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "A.J. Wires",
    description: company.description,
    url: siteUrl,
    logo: `${siteUrl}/logo-mark.png`,
    telephone: company.phones,
    email: company.email,
    address: [
      {
        "@type": "PostalAddress",
        name: "Godown",
        streetAddress: "Plot No.1A, Phase-4, IDA Cherlapally, Near Railway Station",
        addressLocality: "Medchal",
        addressRegion: "Telangana",
        postalCode: "500051",
        addressCountry: "IN",
      },
      {
        "@type": "PostalAddress",
        name: "Office",
        streetAddress: "H.No.29-273, Kehava Nagar, Neredmet",
        addressLocality: "Medchal",
        addressRegion: "Telangana",
        postalCode: "500056",
        addressCountry: "IN",
      },
    ],
    vatID: company.gstin,
    makesOffer: [
      { "@type": "Offer", itemOffered: { "@type": "Product", name: "Galvanized Barbed Wire" } },
      { "@type": "Offer", itemOffered: { "@type": "Product", name: "Chain Link Fencing" } },
      { "@type": "Offer", itemOffered: { "@type": "Product", name: "GI Wire" } },
      { "@type": "Offer", itemOffered: { "@type": "Product", name: "Steel" } },
    ],
  };

  return (
    <html lang="en-IN" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Header />
          <main className="pb-16 sm:pb-0">{children}</main>
          <Footer />
          <WhatsAppFloat />
          <StickyMobileBar />
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
