export const company = {
  name: "A.J. Wires",
  tagline: "Galvanized Strength. Made to Spec. Built to Hold.",
  description:
    "A.J. Wires is a Medchal, Hyderabad based manufacturer and trader of galvanized barbed wire, chain link fencing, GI wire, and steel products for agriculture, industrial, infrastructure, security, and project applications across India.",
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
  url: "https://ajwires.in",
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
  icon: "barbed" | "chainlink" | "gi" | "steel";
  image: string;
  specs: { label: string; values: string[] }[];
  applications: string[];
  description: string;
};

export const products: Product[] = [
  {
    slug: "barbed-wire",
    name: "Galvanized Barbed Wire",
    tagline: "Double-strand protection, hot dip galvanized",
    icon: "barbed",
    image: "/images/product-barbed-wire.jpg",
    description:
      "Manufactured from high-tensile GI wire with consistent barb spacing for dependable perimeter security and farm boundary protection.",
    specs: [
      { label: "Construction", values: ["Double-strand GI"] },
      { label: "Wire Gauge", values: ["12 SWG", "14 SWG"] },
      { label: "Barb Spacing", values: ["3 inch", "4 inch", "6 inch"] },
      { label: "Finish", values: ["Hot Dip Galvanized"] },
    ],
    applications: ["Farm fencing", "Security fencing", "Boundary protection"],
  },
  {
    slug: "chain-link-fencing",
    name: "Chain Link Fencing",
    tagline: "Woven steel mesh for industrial-grade enclosures",
    icon: "chainlink",
    image: "/images/product-chain-link.jpg",
    description:
      "Precision-woven chain link mesh available in multiple gauges and finishes, built for long-term outdoor exposure and high-traffic perimeters.",
    specs: [
      { label: "Mesh Size", values: ["50 mm", "60 mm", "75 mm"] },
      { label: "Wire Gauge", values: ["8 SWG – 12 SWG"] },
      { label: "Finish", values: ["GI", "PVC Coated"] },
    ],
    applications: ["Industrial fencing", "Sports grounds", "Perimeters", "Solar projects"],
  },
  {
    slug: "gi-wire",
    name: "GI Wire",
    tagline: "Hot dip galvanized wire for every application",
    icon: "gi",
    image: "/images/product-gi-wire.jpg",
    description:
      "General-purpose galvanized iron wire engineered for corrosion resistance and tensile strength across binding, fabrication, and agricultural uses.",
    specs: [
      { label: "Wire Gauge", values: ["8 SWG – 18 SWG"] },
      { label: "Finish", values: ["Hot Dip Galvanized"] },
    ],
    applications: ["Binding", "Fencing", "Fabrication", "Agriculture"],
  },
  {
    slug: "steel",
    name: "Steel",
    tagline: "Bulk steel supply for projects of any scale",
    icon: "steel",
    image: "/images/product-steel.jpg",
    description:
      "Reliable bulk steel sourcing and distribution backed by consistent quality checks, suited for construction and large fabrication projects.",
    specs: [
      { label: "Supply Type", values: ["Bulk & Project Supply"] },
      { label: "Sourcing", values: ["Trading & Distribution"] },
    ],
    applications: ["Construction", "Fabrication", "Industrial projects"],
  },
];

export const values = [
  {
    title: "Manufacturing",
    description: "In-house wire drawing, galvanizing, and fencing production lines.",
  },
  {
    title: "Trading",
    description: "Sourcing and supplying steel and wire products at competitive scale.",
  },
  {
    title: "Steel Distribution",
    description: "Bulk steel distribution backed by dependable logistics.",
  },
  {
    title: "Project Supply",
    description: "Tailored specifications and volumes for large infrastructure projects.",
  },
];

export const timeline = [
  { year: "Foundation", title: "A.J. Wires Established", description: "Started operations in Medchal, Hyderabad as a wire and steel trading outfit." },
  { year: "Growth", title: "Manufacturing Expansion", description: "Added in-house galvanizing and barbed wire production capability." },
  { year: "Scale", title: "Dual Unit Operations", description: "Expanded to two units in Medchal — godown and office — to serve growing demand." },
  { year: "Today", title: "Regional Trusted Supplier", description: "Serving agriculture, infrastructure, security, and industrial clients across Telangana and India." },
];

export const visionMission = [
  {
    title: "Our Vision",
    description:
      "To be Telangana's most dependable name in galvanized wire and steel — recognized for consistency, capacity, and integrity in every dispatch.",
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
  { id: "g3", category: "GI Wire", title: "GI Wire Coils", image: "/images/gallery-gi-wire-1.jpg" },
  { id: "g4", category: "Barbed Wire", title: "Barbed Wire Spools", image: "/images/gallery-barbed-wire-1.jpg" },
  { id: "g5", category: "Chain Link", title: "Chain Link Rolls", image: "/images/gallery-chain-link-1.jpg" },
  { id: "g6", category: "Products", title: "Finished Product Range", image: "/images/gallery-products-1.jpg" },
  { id: "g7", category: "Packing", title: "Bundle Packing", image: "/images/gallery-packing-1.jpg" },
  { id: "g8", category: "Dispatch", title: "Loading for Dispatch", image: "/images/gallery-dispatch-1.jpg" },
  { id: "g9", category: "Projects", title: "Site Installation", image: "/images/gallery-projects-1.jpg" },
  { id: "g10", category: "Factory", title: "Manufacturing Floor", image: "/images/gallery-factory-1.jpg" },
  { id: "g11", category: "Chain Link", title: "PVC Coated Mesh", image: "/images/gallery-chain-link-2.jpg" },
  { id: "g12", category: "Projects", title: "Solar Farm Perimeter", image: "/images/gallery-projects-1.jpg" },
];

export const productOptions = [
  "Galvanized Barbed Wire",
  "Chain Link Fencing",
  "GI Wire",
  "Steel",
  "Other / Custom",
];
