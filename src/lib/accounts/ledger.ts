import type { Party, Purchase, Sale, Payment, Expense, JournalVoucher, CreditNote, DebitNote, LedgerAccountType } from "@/lib/accounts/types";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type { LedgerAccountType };

export type LedgerEntry = {
  date: string;
  voucherType: "Purchase" | "Sales" | "Payment" | "Opening" | "Journal" | "Credit Note" | "Debit Note";
  refNumber: string;
  narration: string;
  debit: number;
  credit: number;
};

export type LedgerAccount = {
  name: string;
  type: LedgerAccountType;
  entries: LedgerEntry[];
  totalDebit: number;
  totalCredit: number;
  balance: number; // positive = net debit balance, negative = net credit balance
};

const FIXED_ACCOUNTS: { name: string; type: LedgerAccountType }[] = [
  { name: "Cash", type: "asset" },
  { name: "Bank", type: "asset" },
  { name: "Sales", type: "income" },
  { name: "Purchases", type: "expense" },
  { name: "Input CGST", type: "asset" },
  { name: "Input SGST", type: "asset" },
  { name: "Input IGST", type: "asset" },
  { name: "Output CGST", type: "liability" },
  { name: "Output SGST", type: "liability" },
  { name: "Output IGST", type: "liability" },
  { name: "Round Off", type: "expense" },
];

function post(
  ledgers: Map<string, LedgerAccount>,
  accountName: string,
  type: LedgerAccountType,
  entry: LedgerEntry
) {
  let account = ledgers.get(accountName);
  if (!account) {
    account = { name: accountName, type, entries: [], totalDebit: 0, totalCredit: 0, balance: 0 };
    ledgers.set(accountName, account);
  }
  account.entries.push(entry);
  account.totalDebit = round2(account.totalDebit + entry.debit);
  account.totalCredit = round2(account.totalCredit + entry.credit);
  account.balance = round2(account.totalDebit - account.totalCredit);
}

function cashOrBank(method: Payment["method"]): "Cash" | "Bank" {
  return method === "cash" ? "Cash" : "Bank";
}

// Every purchase, sale, and payment is posted as a balanced double-entry
// journal entry — this is computed fresh from the transactional records
// (not a separately-stored ledger), so it can never drift out of sync.
export function buildGeneralLedger(
  parties: Party[],
  purchases: Purchase[],
  sales: Sale[],
  payments: Payment[],
  expenses: Expense[] = [],
  journalVouchers: JournalVoucher[] = [],
  creditNotes: CreditNote[] = [],
  debitNotes: DebitNote[] = []
): LedgerAccount[] {
  const ledgers = new Map<string, LedgerAccount>();
  for (const acc of FIXED_ACCOUNTS) {
    ledgers.set(acc.name, { name: acc.name, type: acc.type, entries: [], totalDebit: 0, totalCredit: 0, balance: 0 });
  }
  for (const party of parties) {
    ledgers.set(party.name, { name: party.name, type: "party", entries: [], totalDebit: 0, totalCredit: 0, balance: 0 });
    if (party.openingBalance) {
      post(ledgers, party.name, "party", {
        date: "—",
        voucherType: "Opening",
        refNumber: "Opening balance",
        narration: "Opening balance",
        debit: party.openingBalance > 0 ? party.openingBalance : 0,
        credit: party.openingBalance < 0 ? -party.openingBalance : 0,
      });
    }
  }

  for (const p of purchases) {
    const narration = `Purchase from ${p.supplierName}`;
    if (p.taxableValue) post(ledgers, "Purchases", "expense", { date: p.billDate, voucherType: "Purchase", refNumber: p.billNumber, narration, debit: p.taxableValue, credit: 0 });
    if (p.cgst) post(ledgers, "Input CGST", "asset", { date: p.billDate, voucherType: "Purchase", refNumber: p.billNumber, narration, debit: p.cgst, credit: 0 });
    if (p.sgst) post(ledgers, "Input SGST", "asset", { date: p.billDate, voucherType: "Purchase", refNumber: p.billNumber, narration, debit: p.sgst, credit: 0 });
    if (p.igst) post(ledgers, "Input IGST", "asset", { date: p.billDate, voucherType: "Purchase", refNumber: p.billNumber, narration, debit: p.igst, credit: 0 });
    if (p.roundOff) post(ledgers, "Round Off", "expense", { date: p.billDate, voucherType: "Purchase", refNumber: p.billNumber, narration, debit: p.roundOff > 0 ? p.roundOff : 0, credit: p.roundOff < 0 ? -p.roundOff : 0 });
    post(ledgers, p.supplierName, "party", { date: p.billDate, voucherType: "Purchase", refNumber: p.billNumber, narration, debit: 0, credit: p.grandTotal });
  }

  for (const s of sales) {
    const narration = `Sale to ${s.customerName}`;
    post(ledgers, s.customerName, "party", { date: s.invoiceDate, voucherType: "Sales", refNumber: s.invoiceNumber, narration, debit: s.grandTotal, credit: 0 });
    if (s.taxableValue) post(ledgers, "Sales", "income", { date: s.invoiceDate, voucherType: "Sales", refNumber: s.invoiceNumber, narration, debit: 0, credit: s.taxableValue });
    if (s.cgst) post(ledgers, "Output CGST", "liability", { date: s.invoiceDate, voucherType: "Sales", refNumber: s.invoiceNumber, narration, debit: 0, credit: s.cgst });
    if (s.sgst) post(ledgers, "Output SGST", "liability", { date: s.invoiceDate, voucherType: "Sales", refNumber: s.invoiceNumber, narration, debit: 0, credit: s.sgst });
    if (s.igst) post(ledgers, "Output IGST", "liability", { date: s.invoiceDate, voucherType: "Sales", refNumber: s.invoiceNumber, narration, debit: 0, credit: s.igst });
    if (s.roundOff) post(ledgers, "Round Off", "expense", { date: s.invoiceDate, voucherType: "Sales", refNumber: s.invoiceNumber, narration, debit: s.roundOff < 0 ? -s.roundOff : 0, credit: s.roundOff > 0 ? s.roundOff : 0 });
  }

  for (const pay of payments) {
    const cashBank = cashOrBank(pay.method);
    const narration = `${pay.direction === "received" ? "Received from" : "Paid to"} ${pay.partyName} (${pay.linkedNumber})`;
    if (pay.direction === "received") {
      post(ledgers, cashBank, "asset", { date: pay.paymentDate, voucherType: "Payment", refNumber: pay.linkedNumber, narration, debit: pay.amount, credit: 0 });
      post(ledgers, pay.partyName, "party", { date: pay.paymentDate, voucherType: "Payment", refNumber: pay.linkedNumber, narration, debit: 0, credit: pay.amount });
    } else {
      post(ledgers, pay.partyName, "party", { date: pay.paymentDate, voucherType: "Payment", refNumber: pay.linkedNumber, narration, debit: pay.amount, credit: 0 });
      post(ledgers, cashBank, "asset", { date: pay.paymentDate, voucherType: "Payment", refNumber: pay.linkedNumber, narration, debit: 0, credit: pay.amount });
    }
  }

  for (const exp of expenses) {
    const cashBank = cashOrBank(exp.method);
    const narration = exp.description || exp.category;
    if (exp.direction === "expense") {
      post(ledgers, exp.category, "expense", { date: exp.date, voucherType: "Payment", refNumber: exp.category, narration, debit: exp.taxableValue, credit: 0 });
      if (exp.cgst) post(ledgers, "Input CGST", "asset", { date: exp.date, voucherType: "Payment", refNumber: exp.category, narration, debit: exp.cgst, credit: 0 });
      if (exp.sgst) post(ledgers, "Input SGST", "asset", { date: exp.date, voucherType: "Payment", refNumber: exp.category, narration, debit: exp.sgst, credit: 0 });
      if (exp.igst) post(ledgers, "Input IGST", "asset", { date: exp.date, voucherType: "Payment", refNumber: exp.category, narration, debit: exp.igst, credit: 0 });
      post(ledgers, cashBank, "asset", { date: exp.date, voucherType: "Payment", refNumber: exp.category, narration, debit: 0, credit: exp.grandTotal });
    } else {
      post(ledgers, cashBank, "asset", { date: exp.date, voucherType: "Payment", refNumber: exp.category, narration, debit: exp.grandTotal, credit: 0 });
      post(ledgers, exp.category, "income", { date: exp.date, voucherType: "Payment", refNumber: exp.category, narration, debit: 0, credit: exp.taxableValue });
      if (exp.cgst) post(ledgers, "Output CGST", "liability", { date: exp.date, voucherType: "Payment", refNumber: exp.category, narration, debit: 0, credit: exp.cgst });
      if (exp.sgst) post(ledgers, "Output SGST", "liability", { date: exp.date, voucherType: "Payment", refNumber: exp.category, narration, debit: 0, credit: exp.sgst });
      if (exp.igst) post(ledgers, "Output IGST", "liability", { date: exp.date, voucherType: "Payment", refNumber: exp.category, narration, debit: 0, credit: exp.igst });
    }
  }

  for (const jv of journalVouchers) {
    for (const line of jv.lines) {
      if (line.debit) {
        post(ledgers, line.accountName, line.accountType, { date: jv.date, voucherType: "Journal", refNumber: jv.id.slice(0, 6), narration: jv.narration, debit: line.debit, credit: 0 });
      }
      if (line.credit) {
        post(ledgers, line.accountName, line.accountType, { date: jv.date, voucherType: "Journal", refNumber: jv.id.slice(0, 6), narration: jv.narration, debit: 0, credit: line.credit });
      }
    }
  }

  // Credit/debit notes reverse a slice of the original sale/purchase entry —
  // the original invoice/bill entry is left untouched for audit purposes.
  for (const cn of creditNotes) {
    const narration = `Credit note against ${cn.linkedInvoiceNumber} (${cn.reason})`;
    post(ledgers, cn.customerName, "party", { date: cn.noteDate, voucherType: "Credit Note", refNumber: cn.noteNumber, narration, debit: 0, credit: cn.grandTotal });
    if (cn.taxableValue) post(ledgers, "Sales", "income", { date: cn.noteDate, voucherType: "Credit Note", refNumber: cn.noteNumber, narration, debit: cn.taxableValue, credit: 0 });
    if (cn.cgst) post(ledgers, "Output CGST", "liability", { date: cn.noteDate, voucherType: "Credit Note", refNumber: cn.noteNumber, narration, debit: cn.cgst, credit: 0 });
    if (cn.sgst) post(ledgers, "Output SGST", "liability", { date: cn.noteDate, voucherType: "Credit Note", refNumber: cn.noteNumber, narration, debit: cn.sgst, credit: 0 });
    if (cn.igst) post(ledgers, "Output IGST", "liability", { date: cn.noteDate, voucherType: "Credit Note", refNumber: cn.noteNumber, narration, debit: cn.igst, credit: 0 });
  }

  for (const dn of debitNotes) {
    const narration = `Debit note against ${dn.linkedBillNumber} (${dn.reason})`;
    post(ledgers, dn.supplierName, "party", { date: dn.noteDate, voucherType: "Debit Note", refNumber: dn.noteNumber, narration, debit: dn.grandTotal, credit: 0 });
    if (dn.taxableValue) post(ledgers, "Purchases", "expense", { date: dn.noteDate, voucherType: "Debit Note", refNumber: dn.noteNumber, narration, debit: 0, credit: dn.taxableValue });
    if (dn.cgst) post(ledgers, "Input CGST", "asset", { date: dn.noteDate, voucherType: "Debit Note", refNumber: dn.noteNumber, narration, debit: 0, credit: dn.cgst });
    if (dn.sgst) post(ledgers, "Input SGST", "asset", { date: dn.noteDate, voucherType: "Debit Note", refNumber: dn.noteNumber, narration, debit: 0, credit: dn.sgst });
    if (dn.igst) post(ledgers, "Input IGST", "asset", { date: dn.noteDate, voucherType: "Debit Note", refNumber: dn.noteNumber, narration, debit: 0, credit: dn.igst });
  }

  return Array.from(ledgers.values())
    .filter((acc) => acc.entries.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}
