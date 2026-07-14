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

// Bill of materials: one row per raw material consumed to produce ONE unit
// of this (finished-good) item. Empty for raw-material-only items.
export type BomLine = {
  itemId: string;
  itemName: string;
  quantityPerUnit: number;
  unit: Unit;
};

export type Item = {
  id: string;
  name: string;
  category: ItemCategory;
  hsnCode: string;
  unit: Unit;
  defaultCostPrice: number;
  defaultSalePrice: number;
  gstRate: number;
  openingStock: number;
  reorderLevel: number;
  bom: BomLine[];
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

// Consumes raw materials (per the finished item's BOM, scaled by quantity
// produced) out of stock and adds the finished good into stock, valued at
// the consumed materials' cost + any additional production cost.
export type ProductionConsumedLine = {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: Unit;
  rate: number;
  value: number;
};

export type ProductionVoucher = {
  id: string;
  date: string;
  finishedItemId: string;
  finishedItemName: string;
  quantityProduced: number;
  unit: Unit;
  consumedLines: ProductionConsumedLine[];
  materialCost: number;
  additionalCost: number;
  totalCost: number;
  unitCost: number;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type ProductionVoucherInput = Omit<ProductionVoucher, "id" | "createdBy" | "createdAt">;

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

export type PurchaseOrderStatus = "draft" | "sent" | "confirmed" | "cancelled" | "converted";

export const PURCHASE_ORDER_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: "Draft",
  sent: "Sent to Supplier",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  converted: "Converted to Purchase",
};

// Pre-bill commitment to a supplier. Mirrors Purchase's line-item/GST shape
// so converting one into the other is a straight copy, but carries no
// amountPaid/paymentStatus — nothing is owed until it becomes a real bill.
export type PurchaseOrder = {
  id: string;
  poNumber: string;
  poDate: string;
  expectedDate: string;
  supplierId: string;
  supplierName: string;
  placeOfSupplyStateCode: string;
  items: BillItemLine[];
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  status: PurchaseOrderStatus;
  convertedPurchaseId: string;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type PurchaseOrderInput = Omit<PurchaseOrder, "id" | "createdBy" | "createdAt">;

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
  // TDS the CUSTOMER deducts before paying us (they remit it to the
  // government under our PAN — verify via Form 26AS). Treated like a
  // payment for outstanding/status purposes even though it never hits our
  // bank — see src/lib/accounts/outstanding.ts.
  tdsSection: TdsSection | "";
  tdsAmount: number;
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

export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired" | "converted";

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: "Draft",
  sent: "Sent to Customer",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  converted: "Converted to Invoice",
};

// Pre-invoice offer to a customer. Mirrors Sale's line-item/GST/margin shape
// so converting one into the other is a straight copy, but carries no
// amountReceived/paymentStatus — nothing is owed until it becomes a real invoice.
export type Quotation = {
  id: string;
  quoteNumber: string;
  quoteDate: string;
  validUntil: string;
  customerId: string;
  customerName: string;
  placeOfSupplyStateCode: string;
  items: SaleItemLine[];
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  status: QuotationStatus;
  convertedSaleId: string;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type QuotationInput = Omit<Quotation, "id" | "createdBy" | "createdAt">;

// Sales return / post-invoice reduction issued to a customer. Does not
// modify the original invoice (keeps its numbering and figures intact for
// audit purposes) — the linked invoice's *net outstanding* is reduced by
// this note's grand total wherever outstanding balances are computed.
export type CreditNote = {
  id: string;
  noteNumber: string;
  noteDate: string;
  customerId: string;
  customerName: string;
  linkedSaleId: string;
  linkedInvoiceNumber: string;
  reason: string;
  items: BillItemLine[];
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type CreditNoteInput = Omit<CreditNote, "id" | "createdBy" | "createdAt">;

// Purchase return / post-bill reduction issued to a supplier. Mirrors
// CreditNote for the purchase side.
export type DebitNote = {
  id: string;
  noteNumber: string;
  noteDate: string;
  supplierId: string;
  supplierName: string;
  linkedPurchaseId: string;
  linkedBillNumber: string;
  reason: string;
  items: BillItemLine[];
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type DebitNoteInput = Omit<DebitNote, "id" | "createdBy" | "createdAt">;

export type PaymentDirection = "received" | "paid";
export type PaymentMethod = "bank" | "cash" | "upi" | "cheque";
export type LinkedBillType = "sale" | "purchase" | "payslip";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank: "Bank Transfer",
  cash: "Cash",
  upi: "UPI",
  cheque: "Cheque",
};

export type Payment = {
  id: string;
  partyId: string;
  partyName: string;
  direction: PaymentDirection;
  linkedType: LinkedBillType;
  linkedId: string;
  linkedNumber: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
  reconciled: boolean;
  createdBy: string;
  createdAt: string;
};

export type PaymentInput = Omit<Payment, "id" | "createdBy" | "createdAt" | "reconciled">;

export type LedgerAccountType = "asset" | "liability" | "income" | "expense" | "party";

export type JournalLine = {
  accountName: string;
  accountType: LedgerAccountType;
  debit: number;
  credit: number;
};

export type JournalVoucher = {
  id: string;
  date: string;
  narration: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  createdBy: string;
  createdAt: string;
};

export type JournalVoucherInput = Omit<JournalVoucher, "id" | "createdBy" | "createdAt">;

export type ExpenseDirection = "expense" | "income";

export type Expense = {
  id: string;
  direction: ExpenseDirection;
  category: string;
  description: string;
  partyName: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  gstApplicable: boolean;
  gstRate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
  // TDS WE deduct before paying a vendor (Rent, Professional Fees,
  // Commission, Contractor payments, ...). tdsAmount is withheld from cash
  // paid and becomes a "TDS Payable" liability until deposited via a
  // TdsChallan — see src/lib/accounts/ledger.ts and tds.ts.
  tdsSection: TdsSection | "";
  tdsRatePercent: number;
  tdsAmount: number;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type ExpenseInput = Omit<Expense, "id" | "createdBy" | "createdAt">;

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Salaries & Wages",
  "Electricity",
  "Fuel & Transport",
  "Repairs & Maintenance",
  "Office Supplies",
  "Telephone & Internet",
  "Bank Charges",
  "Professional Fees",
  "Insurance",
  "Freight & Courier",
  "Capital Expenditure (Fixed Asset)",
  "Other Expense",
];

// The cash still counts as money out in Cash Flow (it really left the
// business), but this category is excluded from P&L/net-profit expense
// totals — it's capitalized as a Fixed Asset rather than expensed, and only
// its depreciation (computed separately) should reduce profit. See
// src/lib/accounts/depreciation.ts and pnl.ts.
export const CAPITAL_EXPENDITURE_CATEGORY = "Capital Expenditure (Fixed Asset)";

export const INCOME_CATEGORIES = [
  "Interest Income",
  "Rent Received",
  "Commission Income",
  "Scrap Sale",
  "Other Income",
];

// Manual corrections to the auto-computed GST Summary — e.g. reverse charge
// liability, ITC reversal, TDS/TCS, or rounding — that Tally would otherwise
// require a separate journal for. Signed: positive increases net GST
// payable, negative reduces it (adds ITC / carries forward).
export const GST_ADJUSTMENT_CATEGORIES = [
  "Reverse Charge (RCM)",
  "ITC Reversal",
  "TDS/TCS",
  "Rounding",
  "Other",
] as const;

export type GstAdjustmentCategory = (typeof GST_ADJUSTMENT_CATEGORIES)[number];

export type GstAdjustment = {
  id: string;
  date: string;
  category: GstAdjustmentCategory;
  description: string;
  cgst: number;
  sgst: number;
  igst: number;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type GstAdjustmentInput = Omit<GstAdjustment, "id" | "createdBy" | "createdAt">;

export type DepreciationMethod = "wdv" | "slm";

export const DEPRECIATION_METHOD_LABELS: Record<DepreciationMethod, string> = {
  wdv: "Written Down Value (WDV)",
  slm: "Straight Line (SLM)",
};

export const ASSET_CATEGORIES = [
  "Plant & Machinery",
  "Furniture & Fixtures",
  "Computers & Software",
  "Vehicles",
  "Office Equipment",
  "Building",
  "Other",
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

// Standard Income Tax Act (WDV, block-of-assets) rates — working defaults,
// editable per asset. Verify with your CA before filing.
export const DEFAULT_DEPRECIATION_RATES: Record<AssetCategory, number> = {
  "Plant & Machinery": 15,
  "Furniture & Fixtures": 10,
  "Computers & Software": 40,
  "Vehicles": 15,
  "Office Equipment": 15,
  "Building": 10,
  "Other": 15,
};

export type AssetStatus = "active" | "disposed";

export type FixedAsset = {
  id: string;
  assetName: string;
  category: AssetCategory;
  purchaseDate: string;
  purchaseCost: number;
  vendorName: string;
  depreciationMethod: DepreciationMethod;
  depreciationRatePercent: number; // WDV
  usefulLifeYears: number; // SLM
  salvageValue: number; // SLM
  status: AssetStatus;
  disposalDate: string;
  disposalValue: number;
  linkedExpenseId: string;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type FixedAssetInput = Omit<FixedAsset, "id" | "createdBy" | "createdAt">;

// Sections most relevant to a trading/manufacturing business paying rent,
// commission, contractors, and professional fees. Rates are working
// defaults (Finance Act rates change and depend on PAN availability/
// thresholds) — verify with your CA before relying on them.
export const TDS_SECTIONS = [
  "192B - Salary",
  "194C - Contractors",
  "194H - Commission/Brokerage",
  "194I - Rent",
  "194J - Professional/Technical Fees",
  "194Q - Purchase of Goods",
  "Other",
] as const;

export type TdsSection = (typeof TDS_SECTIONS)[number];

// Salary TDS (192B) has no flat rate — it's slab/regime based per employee,
// so it's entered manually on the payslip rather than computed here.
export const DEFAULT_TDS_RATES: Record<TdsSection, number> = {
  "192B - Salary": 0,
  "194C - Contractors": 1,
  "194H - Commission/Brokerage": 5,
  "194I - Rent": 10,
  "194J - Professional/Technical Fees": 10,
  "194Q - Purchase of Goods": 0.1,
  Other: 10,
};

// A challan (Form 281) recording actual deposit of deducted TDS with the
// government — reduces the outstanding TDS Payable liability. BSR
// code/challan serial together form the CIN quoted in the quarterly return.
export type TdsChallan = {
  id: string;
  date: string;
  section: TdsSection;
  amount: number;
  bsrCode: string;
  challanSerialNumber: string;
  quarter: string;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type TdsChallanInput = Omit<TdsChallan, "id" | "createdBy" | "createdAt">;

export type EmployeeStatus = "active" | "inactive";

// Salary structure + statutory flags. PF/ESI rates are working defaults
// (PF wage-ceiling rules and ESI's ₹21,000 gross threshold aren't modeled —
// verify applicability and exact amounts with your CA).
export type Employee = {
  id: string;
  name: string;
  employeeCode: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  dateOfLeaving: string;
  status: EmployeeStatus;
  panNumber: string;
  bankAccountNumber: string;
  bankIfsc: string;
  basic: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  pfApplicable: boolean;
  pfRatePercent: number;
  esiApplicable: boolean;
  esiEmployeeRatePercent: number;
  esiEmployerRatePercent: number;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type EmployeeInput = Omit<Employee, "id" | "createdBy" | "createdAt">;

// One per employee per month. Generated in a batch from each active
// Employee's current salary structure ("Generate Payroll"), then editable
// per employee (bonus, unpaid-leave deduction, TDS, etc). amountPaid/
// paymentStatus follow the same pattern as Purchase/Sale — cleared via the
// existing Payments mechanism (linkedType: "payslip").
export type Payslip = {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  basic: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  professionalTax: number;
  tdsSalary: number;
  otherDeductions: number;
  netSalary: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type PayslipInput = Omit<Payslip, "id" | "createdBy" | "createdAt">;

export type StatutoryPaymentType = "PF" | "ESI" | "PT";

export const STATUTORY_PAYMENT_TYPE_LABELS: Record<StatutoryPaymentType, string> = {
  PF: "Provident Fund",
  ESI: "ESI",
  PT: "Professional Tax",
};

// A deposit against PF/ESI/Professional Tax withheld from payslips —
// reduces the corresponding payable liability, same role as a TdsChallan
// but for these three statutory dues instead of income-tax TDS.
export type StatutoryPayment = {
  id: string;
  date: string;
  type: StatutoryPaymentType;
  amount: number;
  referenceNumber: string;
  period: string;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type StatutoryPaymentInput = Omit<StatutoryPayment, "id" | "createdBy" | "createdAt">;

export type AgingBucket = "0-30" | "31-60" | "61-90" | "90+";

export type AgingRow = {
  id: string;
  number: string;
  partyName: string;
  partyEmail: string;
  dueDate: string;
  daysOverdue: number;
  bucket: AgingBucket;
  outstanding: number;
};

export type ReminderLog = {
  id: string;
  billType: "sale" | "purchase";
  billId: string;
  billNumber: string;
  partyName: string;
  sentTo: string;
  channel: "email";
  subject: string;
  status: "sent" | "failed" | "not_configured";
  errorMessage: string;
  sentBy: string;
  sentAt: string;
};

export type ReminderSettings = {
  dueSoonDays: number;
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = { dueSoonDays: 3 };

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
    openingStock: 0,
    reorderLevel: 500,
    bom: [],
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
    openingStock: 0,
    reorderLevel: 500,
    bom: [],
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
    openingStock: 0,
    reorderLevel: 50,
    bom: [],
    notes: "Default HSN 7314 for wire netting / fencing grill — verify with CA.",
  },
];
