export const company = {
  name: "A.J. Wires",
  tagline: "Galvanized Strength. Made to Spec. Built to Hold.",
  description:
    "A.J. Wires is a Medchal, Hyderabad based manufacturer and trader of galvanized barbed wire, chain link fencing, and GI wire products for agriculture, industrial, infrastructure, security, and project applications across India.",
  gstin: "36CSBPJ0791A1Z5",
  phones: ["+91 99499 93568", "+91 83283 45304"],
  phonesRaw: ["+919949993568", "+918328345304"],
  whatsapp: "+919949993568",
  email: "ajwires2025@gmail.com",
  godown: {
    label: "Godown",
    lines: [
      "Plot No.1A, Phase-4, IDA Cherlapally,",
      "Near Railway Station,",
      "Medchal – 500051,",
      "Malkajgiri District, Telangana",
    ],
  },
  office: {
    label: "Office",
    lines: [
      "H.No.29-273, Kehava Nagar,",
      "Neredmet,",
      "Medchal – 500056,",
      "Malkajgiri District, Telangana",
    ],
  },
  url: "https://ajwires.com",
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/infrastructure", label: "Infrastructure" },
  { href: "/quality", label: "Quality" },
  { href: "/applications", label: "Applications" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export const stats = [
  { value: 10, suffix: "+", label: "Years in Business" },
  { value: 3, suffix: "+", label: "Product Categories" },
  { value: 100, suffix: "%", label: "Galvanized Products" },
  { value: 2, suffix: "", label: "Units in Medchal" },
];

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  icon: "barbed" | "chainlink" | "gi";
  image: string;
  specs: { label: string; values: string[] }[];
  applications: string[];
  description: string;
  sizeGallery?: { label: string; image: string }[];
};

export const products: Product[] = [
  {
    slug: "barbed-wire",
    name: "Galvanized Barbed Wire",
    tagline: "Double-strand protection, hot dip galvanized",
    icon: "barbed",
    image: "/images/AJ-Wires-Double-Strand-Barbed-Wire.png",
    description:
      "Manufactured from high-tensile GI wire with consistent barb spacing for dependable perimeter security and farm boundary protection. Available in single and double-strand construction across a full range of gauges and barb spacings to match your specification.",
    specs: [
      { label: "Construction", values: ["Single-strand GI", "Double-strand GI"] },
      { label: "Line Wire Gauge", values: ["8 SWG", "10 SWG", "12 SWG", "12.5 SWG", "14 SWG", "16 SWG"] },
      { label: "Barb Wire Gauge", values: ["14 SWG", "16 SWG", "18 SWG"] },
      { label: "Barb Spacing", values: ["2 inch", "3 inch", "4 inch", "5 inch", "6 inch"] },
      { label: "Roll Length", values: ["200 m", "250 m", "400 m", "500 m", "Custom length"] },
      { label: "Coil Weight", values: ["25 kg", "45 kg", "50 kg", "Custom weight"] },
      { label: "Finish", values: ["Hot Dip Galvanized", "Electro Galvanized"] },
    ],
    applications: ["Farm fencing", "Security fencing", "Boundary protection"],
    sizeGallery: [
      { label: "12 SWG", image: "/images/AJ-Wires-Galvanized-Barbed-Wire-12G.png" },
      { label: "14 SWG", image: "/images/AJ-Wires-Double-Strand-Barbed-Wire-14G.png" },
      { label: "14 SWG — Detail", image: "/images/AJ-Wires-Galvanized-Barbed-Wire-14G.png" },
      { label: "16 SWG", image: "/images/AJ-Wires-Double-Strand-Barbed-Wire-16G.png" },
      { label: "16 SWG — Detail", image: "/images/AJ-Wires-Galvanized-Barbed-Wire-16G.png" },
    ],
  },
  {
    slug: "chain-link-fencing",
    name: "Chain Link Fencing",
    tagline: "Woven steel mesh for industrial-grade enclosures",
    icon: "chainlink",
    image: "/images/AJ-Wires-Galvanized-Chain-Link-Fence-Panel.png",
    description:
      "Precision-woven chain link mesh available in multiple mesh sizes, gauges, heights, and finishes, built for long-term outdoor exposure and high-traffic perimeters.",
    specs: [
      { label: "Mesh Size", values: ["25 mm", "30 mm", "40 mm", "50 mm", "60 mm", "65 mm", "75 mm", "100 mm"] },
      { label: "Wire Gauge", values: ["6 SWG", "8 SWG", "9 SWG", "10 SWG", "11 SWG", "12 SWG", "13 SWG", "14 SWG"] },
      { label: "Roll Height", values: ["3 ft", "4 ft", "5 ft", "6 ft", "8 ft", "10 ft", "12 ft"] },
      { label: "Roll Length", values: ["10 m", "20 m", "30 m", "Custom length"] },
      { label: "Finish", values: ["GI", "PVC Coated", "Galvanized + PVC Coated"] },
      { label: "PVC Colour", values: ["Green", "Black", "Dark Green"] },
    ],
    applications: ["Industrial fencing", "Sports grounds", "Perimeters", "Solar projects"],
    sizeGallery: [
      { label: "50mm Mesh · 2.5mm", image: "/images/AJ-Wires-Galv-Chain-Link-50mm-Installed.png" },
      { label: "60mm Mesh · 3.0mm", image: "/images/AJ-Wires-Galv-Chain-Link-60mm-3-0mm.png" },
      { label: "60mm Mesh · 3.5mm — Installed", image: "/images/AJ-Wires-Galv-Chain-Link-60mm-3-5mm.png" },
      { label: "Fabric Roll · 3.0mm — Installed", image: "/images/AJ-Wires-Galv-Chain-Link-Fabric-Roll.png" },
      { label: "PVC Green · 1.8mm", image: "/images/AJ-Wires-PVC-Chain-Link-Green-1-8mm.png" },
      { label: "PVC Green · 2.0mm", image: "/images/AJ-Wires-PVC-Chain-Link-Green-2-0mm.png" },
      { label: "PVC Green · 2.5mm", image: "/images/AJ-Wires-PVC-Chain-Link-Green-2-5mm.png" },
      { label: "PVC Green · 3.0mm", image: "/images/AJ-Wires-PVC-Chain-Link-Green-3-0mm.png" },
    ],
  },
  {
    slug: "gi-wire",
    name: "GI Wire",
    tagline: "Hot dip galvanized wire for every application",
    icon: "gi",
    image: "/images/AJ-Wires-Galvanized-Iron-Binding-Wire.png",
    description:
      "General-purpose galvanized iron wire engineered for corrosion resistance and tensile strength across binding, fabrication, and agricultural uses. Supplied across a full gauge range and in soft, medium, or hard temper to suit the application.",
    specs: [
      { label: "Wire Gauge", values: ["6 SWG", "8 SWG", "10 SWG", "12 SWG", "14 SWG", "16 SWG", "18 SWG", "20 SWG", "22 SWG"] },
      { label: "Temper", values: ["Soft", "Medium", "Hard"] },
      { label: "Coil Weight", values: ["5 kg", "10 kg", "25 kg", "50 kg", "Custom weight"] },
      { label: "Finish", values: ["Hot Dip Galvanized", "Electro Galvanized"] },
    ],
    applications: ["Binding", "Fencing", "Fabrication", "Agriculture"],
    sizeGallery: [
      { label: "8 SWG — Hot Dip", image: "/images/AJ-Wires-Hot-Dipped-Galvanized-Wire-8SWG.png" },
      { label: "10 SWG — Hot Dip", image: "/images/AJ-Wires-Hot-Dipped-Galvanized-Wire-10SWG.png" },
      { label: "12 SWG", image: "/images/AJ-Wires-Galvanized-Iron-Wire-12SWG.png" },
      { label: "14 SWG", image: "/images/AJ-Wires-Galvanized-Iron-Wire-14SWG.png" },
      { label: "18 SWG — Binding Wire", image: "/images/AJ-Wires-GI-Binding-Wire-18SWG.png" },
      { label: "20 SWG — Binding Wire", image: "/images/AJ-Wires-GI-Binding-Wire-20SWG.png" },
      { label: "22 SWG — Binding Wire", image: "/images/AJ-Wires-GI-Binding-Wire-22SWG.png" },
    ],
  },
];

export const values = [
  {
    title: "Manufacturing",
    description: "In-house wire drawing, galvanizing, and fencing production lines.",
  },
  {
    title: "Trading",
    description: "Sourcing and supplying wire products at competitive scale.",
  },
  {
    title: "Project Supply",
    description: "Tailored specifications and volumes for large infrastructure projects.",
  },
];

export const timeline = [
  { year: "Foundation", title: "A.J. Wires Established", description: "Started operations in Medchal, Hyderabad as a wire trading outfit." },
  { year: "Growth", title: "Manufacturing Expansion", description: "Added in-house galvanizing and barbed wire production capability." },
  { year: "Scale", title: "Dual Unit Operations", description: "Expanded to two units in Medchal — godown and office — to serve growing demand." },
  { year: "Today", title: "Regional Trusted Supplier", description: "Serving agriculture, infrastructure, security, and industrial clients across Telangana and India." },
];

export const visionMission = [
  {
    title: "Our Vision",
    description:
      "To be Telangana's most dependable name in galvanized wire and fencing — recognized for consistency, capacity, and integrity in every dispatch.",
  },
  {
    title: "Our Mission",
    description:
      "To manufacture and supply made-to-spec galvanized products at scale, backed by quality checks and on-time delivery, for customers across India and export markets.",
  },
];

export const whyChooseUs = [
  { title: "Made to Spec", description: "Every order manufactured and packed to your exact gauge, spacing, and finish requirements." },
  { title: "Hot Dip Galvanized", description: "Superior corrosion resistance for long service life in all environments." },
  { title: "Bulk Capacity", description: "Equipped to handle large-volume project and export-scale orders." },
  { title: "Dependable Supply", description: "Consistent stock and dispatch discipline across our Medchal units." },
];

export const qualityMetrics = [
  { label: "Made to Spec", value: 100, description: "Custom gauge, spacing, and finish on every order" },
  { label: "Hot Dip Galvanized", value: 100, description: "Full-coverage zinc coating for corrosion resistance" },
  { label: "Consistent Quality", value: 98, description: "Rigorous in-process quality checks" },
  { label: "Bulk Supply Readiness", value: 95, description: "Capacity for large project volumes" },
  { label: "Safe Packing", value: 100, description: "Damage-resistant coiling and bundling" },
  { label: "Timely Delivery", value: 96, description: "Dispatch discipline across Telangana & India" },
];

export const qualityChecks = [
  { title: "Raw Material Check", description: "Incoming wire rod and steel verified before production begins." },
  { title: "Tensile Strength Test", description: "Sample testing ensures wire meets required strength for its gauge." },
  { title: "Zinc Coating Check", description: "Galvanizing coverage checked for consistency and corrosion resistance." },
  { title: "Dimension & Spacing Check", description: "Gauge, mesh size, and barb spacing verified against the order spec." },
  { title: "Pre-Dispatch Inspection", description: "Final inspection and count before coils and rolls leave the godown." },
];

export const infrastructureSteps = [
  { title: "Wire Drawing", description: "Precision drawing reduces raw rod to exact wire gauges with consistent tensile strength.", image: "/images/infra-wire-drawing.jpg" },
  { title: "Galvanizing", description: "Hot dip galvanizing baths apply a uniform zinc coating for long-term corrosion protection.", image: "/images/infra-galvanizing.jpg" },
  { title: "Manufacturing Line", description: "Automated lines form barbed wire and weave chain link mesh to specification.", image: "/images/infra-manufacturing.jpg" },
  { title: "Quality Packing", description: "Coils and rolls are bundled and packed to withstand transport and storage.", image: "/images/infra-packing.jpg" },
  { title: "Storage", description: "Organized godown storage at IDA Cherlapally keeps stock ready for dispatch.", image: "/images/infra-storage.jpg" },
  { title: "Dispatch", description: "Scheduled logistics ensure on-time delivery across Telangana and India.", image: "/images/infra-dispatch.jpg" },
];

export const applications = [
  { title: "Agriculture", icon: "wheat" },
  { title: "Industrial Perimeters", icon: "factory" },
  { title: "Security Fencing", icon: "shield" },
  { title: "Boundary Walls", icon: "square" },
  { title: "Solar Projects", icon: "sun" },
  { title: "Highways", icon: "road" },
  { title: "Railways", icon: "train" },
  { title: "Sports Grounds", icon: "trophy" },
  { title: "Warehouses", icon: "warehouse" },
  { title: "Infrastructure Projects", icon: "building" },
] as const;

export const galleryCategories = [
  "All",
  "Factory",
  "Products",
  "GI Wire",
  "Chain Link",
  "Barbed Wire",
  "Packing",
  "Dispatch",
  "Projects",
] as const;

export type GalleryItem = {
  id: string;
  category: Exclude<(typeof galleryCategories)[number], "All">;
  title: string;
  image: string;
};

export const galleryItems: GalleryItem[] = [
  { id: "g1", category: "Factory", title: "Wire Drawing Line", image: "/images/infra-wire-drawing.jpg" },
  { id: "g2", category: "Factory", title: "Galvanizing Bath", image: "/images/infra-galvanizing.jpg" },
  { id: "g3", category: "GI Wire", title: "GI Binding Wire Coils", image: "/images/AJ-Wires-Galvanized-Iron-Binding-Wire.png" },
  { id: "g4", category: "Barbed Wire", title: "Double Strand Barbed Wire", image: "/images/AJ-Wires-Double-Strand-Barbed-Wire.png" },
  { id: "g5", category: "Chain Link", title: "Chain Link Rolls", image: "/images/AJ-Wires-Galvanized-Chain-Link-Fence-Panel.png" },
  { id: "g6", category: "Products", title: "Welded Wire Mesh · 1\" x 1\" · 14 Gauge", image: "/images/AJ-Wires-Welded-Mesh-1x1-14G.png" },
  { id: "g7", category: "Packing", title: "Bundle Packing", image: "/images/gallery-packing-1.jpg" },
  { id: "g8", category: "Dispatch", title: "Loading for Dispatch", image: "/images/gallery-dispatch-1.jpg" },
  { id: "g9", category: "Projects", title: "Site Installation", image: "/images/AJ-Wires-Galvanized-Chain-Link-Fencing.png" },
  { id: "g10", category: "Factory", title: "Manufacturing Floor", image: "/images/gallery-factory-1.jpg" },
  { id: "g11", category: "Chain Link", title: "PVC Coated Mesh", image: "/images/AJ-Wires-Green-PVC-Chain-Link-Fence.png" },
  { id: "g12", category: "Projects", title: "Fence Line Close-up", image: "/images/AJ-Wires-Galvanized-Chain-Link-Fence.png" },
  { id: "g13", category: "Barbed Wire", title: "Barbed Wire Detail", image: "/images/AJ-Wires-Galvanized-Barbed-Wire.png" },
  { id: "g14", category: "GI Wire", title: "Hot Dip Galvanized Wire", image: "/images/AJ-Wires-Hot-Dipped-Galvanized-Wire.png" },
  { id: "g15", category: "Factory", title: "Wire Coil Storage", image: "/images/AJ-Wires-Hot-Dipped-Galvanized-Iron-Wire.png" },
  { id: "g16", category: "Products", title: "Welded Wire Mesh · 1/2\" x 1/2\" · 16 Gauge", image: "/images/AJ-Wires-Welded-Mesh-half-16G.png" },
  { id: "g17", category: "Products", title: "Welded Wire Mesh · 3/4\" x 3/4\" · 18 Gauge", image: "/images/AJ-Wires-Welded-Mesh-3q-18G.png" },
];

export const productOptions = [
  "Galvanized Barbed Wire",
  "Chain Link Fencing",
  "GI Wire",
  "Other / Custom",
];

export const faqs = [
  {
    question: "What products does A.J. Wires manufacture and supply?",
    answer:
      "We manufacture and trade Galvanized Barbed Wire, Chain Link Fencing, and GI Wire — supplied to agriculture, industrial, security, and infrastructure projects across Telangana and India.",
  },
  {
    question: "Is A.J. Wires' wire hot dip galvanized?",
    answer:
      "Yes. Our barbed wire, chain link fencing, and GI wire are hot dip galvanized in-house at our Medchal units for consistent corrosion resistance and long outdoor service life.",
  },
  {
    question: "Where is A.J. Wires located?",
    answer:
      "We operate from Medchal, Hyderabad, Telangana — with a godown unit at IDA Cherlapally and an office at Neredmet. See our Contact page for both addresses.",
  },
  {
    question: "Do you supply in bulk for projects outside Telangana?",
    answer:
      "Yes, we manufacture, trade, and dispatch galvanized wire products to project sites across India, not just within Telangana.",
  },
  {
    question: "Is A.J. Wires GST registered?",
    answer: `Yes, A.J. Wires is GST registered (GSTIN: ${company.gstin}) and can issue GST-compliant invoices for your orders.`,
  },
  {
    question: "How do I request a quote or place a bulk order?",
    answer:
      "Use the Request a Quote page to share your specification, or contact us directly by phone or WhatsApp — we typically respond promptly with pricing and lead time.",
  },
];
