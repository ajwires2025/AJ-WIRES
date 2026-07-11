export type PartyType = "customer" | "supplier" | "both";

export type Party = {
  id: string;
  name: string;
  type: PartyType;
  gstin: string;
  state: string;
  stateCode: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
  openingBalance: number;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type PartyInput = Omit<Party, "id" | "createdBy" | "createdAt">;

export type ItemCategory = "gi_wire" | "chain_link" | "barbed_wire" | "other";
export type Unit = "kg" | "meter" | "roll" | "piece";

export type Item = {
  id: string;
  name: string;
  category: ItemCategory;
  hsnCode: string;
  unit: Unit;
  defaultCostPrice: number;
  defaultSalePrice: number;
  gstRate: number;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type ItemInput = Omit<Item, "id" | "createdBy" | "createdAt">;

export const ITEM_CATEGORY_LABELS: Record<ItemCategory, string> = {
  gi_wire: "GI Wire",
  chain_link: "Chain Link Fencing",
  barbed_wire: "Barbed Wire",
  other: "Other",
};

export const UNIT_LABELS: Record<Unit, string> = {
  kg: "Kilogram (kg)",
  meter: "Meter",
  roll: "Roll",
  piece: "Piece",
};

export type PaymentStatus = "unpaid" | "partial" | "paid";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partially Paid",
  paid: "Paid",
};

export type BillItemLine = {
  itemId: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: Unit;
  rate: number;
  taxableValue: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  lineTotal: number;
};

export type Purchase = {
  id: string;
  supplierId: string;
  supplierName: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  placeOfSupplyStateCode: string;
  items: BillItemLine[];
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  billFileUrl: string;
  billFileName: string;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type PurchaseInput = Omit<Purchase, "id" | "createdBy" | "createdAt">;

export type SaleItemLine = BillItemLine & {
  costPrice: number;
  lineMargin: number;
};

export type Sale = {
  id: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  placeOfSupplyStateCode: string;
  items: SaleItemLine[];
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  amountReceived: number;
  paymentStatus: PaymentStatus;
  invoiceFileUrl: string;
  invoiceFileName: string;
  cogsTotal: number;
  grossProfit: number;
  marginPercent: number;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type SaleInput = Omit<Sale, "id" | "createdBy" | "createdAt">;

// Defaults to be verified with the CA — not final. HSN digit-length and exact
// rates depend on turnover/notification and must be confirmed before filing.
export const DEFAULT_ITEMS: ItemInput[] = [
  {
    name: "GI Wire (Hot Dip Galvanized)",
    category: "gi_wire",
    hsnCode: "7217",
    unit: "kg",
    defaultCostPrice: 0,
    defaultSalePrice: 0,
    gstRate: 18,
    notes: "Default HSN 7217 for galvanized iron/steel wire — verify with CA.",
  },
  {
    name: "Barbed Wire",
    category: "barbed_wire",
    hsnCode: "7313",
    unit: "kg",
    defaultCostPrice: 0,
    defaultSalePrice: 0,
    gstRate: 18,
    notes: "Default HSN 7313 for barbed wire — verify with CA.",
  },
  {
    name: "Chain Link Fencing",
    category: "chain_link",
    hsnCode: "7314",
    unit: "roll",
    defaultCostPrice: 0,
    defaultSalePrice: 0,
    gstRate: 18,
    notes: "Default HSN 7314 for wire netting / fencing grill — verify with CA.",
  },
];
