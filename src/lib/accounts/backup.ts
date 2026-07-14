import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { db } from "@/lib/firebase/client";
import type { Purchase, Sale, JournalVoucher, CreditNote, DebitNote, ProductionVoucher, Quotation, PurchaseOrder } from "@/lib/accounts/types";

async function fetchAll<T>(name: string): Promise<T[]> {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

function flattenPurchaseItems(purchases: Purchase[]) {
  return purchases.flatMap((p) =>
    p.items.map((line) => ({
      billNumber: p.billNumber,
      supplierName: p.supplierName,
      ...line,
    }))
  );
}

function flattenSaleItems(sales: Sale[]) {
  return sales.flatMap((s) =>
    s.items.map((line) => ({
      invoiceNumber: s.invoiceNumber,
      customerName: s.customerName,
      ...line,
    }))
  );
}

function flattenJournalLines(vouchers: JournalVoucher[]) {
  return vouchers.flatMap((v) =>
    v.lines.map((line) => ({
      date: v.date,
      narration: v.narration,
      ...line,
    }))
  );
}

function flattenCreditNoteItems(notes: CreditNote[]) {
  return notes.flatMap((n) =>
    n.items.map((line) => ({
      noteNumber: n.noteNumber,
      customerName: n.customerName,
      linkedInvoiceNumber: n.linkedInvoiceNumber,
      ...line,
    }))
  );
}

function flattenDebitNoteItems(notes: DebitNote[]) {
  return notes.flatMap((n) =>
    n.items.map((line) => ({
      noteNumber: n.noteNumber,
      supplierName: n.supplierName,
      linkedBillNumber: n.linkedBillNumber,
      ...line,
    }))
  );
}

function flattenProductionConsumedLines(vouchers: ProductionVoucher[]) {
  return vouchers.flatMap((v) =>
    v.consumedLines.map((line) => ({
      date: v.date,
      finishedItemName: v.finishedItemName,
      ...line,
    }))
  );
}

function flattenQuotationItems(quotations: Quotation[]) {
  return quotations.flatMap((q) =>
    q.items.map((line) => ({
      quoteNumber: q.quoteNumber,
      customerName: q.customerName,
      ...line,
    }))
  );
}

function flattenPurchaseOrderItems(orders: PurchaseOrder[]) {
  return orders.flatMap((o) =>
    o.items.map((line) => ({
      poNumber: o.poNumber,
      supplierName: o.supplierName,
      ...line,
    }))
  );
}

// A flat, one-file backup of every collection — meant as a safety net /
// hand-off to the CA, not a live sync target. Line items are flattened into
// their own sheets since a spreadsheet can't hold nested arrays.
export async function exportAllDataToExcel(): Promise<void> {
  const [
    parties,
    items,
    purchases,
    sales,
    payments,
    expenses,
    journalVouchers,
    creditNotes,
    debitNotes,
    productionVouchers,
    remindersLog,
    quotations,
    purchaseOrders,
    fixedAssets,
    gstAdjustments,
    tdsChallans,
    employees,
    payslips,
    statutoryPayments,
  ] = await Promise.all([
    fetchAll("parties"),
    fetchAll("items"),
    fetchAll<Purchase>("purchases"),
    fetchAll<Sale>("sales"),
    fetchAll("payments"),
    fetchAll("expenses"),
    fetchAll<JournalVoucher>("journalVouchers"),
    fetchAll<CreditNote>("creditNotes"),
    fetchAll<DebitNote>("debitNotes"),
    fetchAll<ProductionVoucher>("productionVouchers"),
    fetchAll("remindersLog"),
    fetchAll<Quotation>("quotations"),
    fetchAll<PurchaseOrder>("purchaseOrders"),
    fetchAll("fixedAssets"),
    fetchAll("gstAdjustments"),
    fetchAll("tdsChallans"),
    fetchAll("employees"),
    fetchAll("payslips"),
    fetchAll("statutoryPayments"),
  ]);

  const purchasesFlat = purchases.map(({ items: _items, ...rest }) => rest);
  const salesFlat = sales.map(({ items: _items, ...rest }) => rest);

  const wb = XLSX.utils.book_new();
  const addSheet = (name: string, rows: unknown[]) => {
    const sheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}]);
    XLSX.utils.book_append_sheet(wb, sheet, name);
  };

  addSheet("Parties", parties);
  addSheet("Items", items);
  addSheet("Purchases", purchasesFlat);
  addSheet("Purchase Line Items", flattenPurchaseItems(purchases));
  addSheet("Sales", salesFlat);
  addSheet("Sale Line Items", flattenSaleItems(sales));
  addSheet("Payments", payments);
  addSheet("Expenses & Other Income", expenses);
  addSheet("Journal Vouchers", journalVouchers.map(({ lines: _lines, ...rest }) => rest));
  addSheet("Journal Voucher Lines", flattenJournalLines(journalVouchers));
  addSheet("Credit Notes", creditNotes.map(({ items: _items, ...rest }) => rest));
  addSheet("Credit Note Items", flattenCreditNoteItems(creditNotes));
  addSheet("Debit Notes", debitNotes.map(({ items: _items, ...rest }) => rest));
  addSheet("Debit Note Items", flattenDebitNoteItems(debitNotes));
  addSheet("Production Entries", productionVouchers.map(({ consumedLines: _consumedLines, ...rest }) => rest));
  addSheet("Production Consumed Materials", flattenProductionConsumedLines(productionVouchers));
  addSheet("Quotations", quotations.map(({ items: _items, ...rest }) => rest));
  addSheet("Quotation Line Items", flattenQuotationItems(quotations));
  addSheet("Purchase Orders", purchaseOrders.map(({ items: _items, ...rest }) => rest));
  addSheet("Purchase Order Line Items", flattenPurchaseOrderItems(purchaseOrders));
  addSheet("Fixed Assets", fixedAssets);
  addSheet("GST Adjustments", gstAdjustments);
  addSheet("TDS Challans", tdsChallans);
  addSheet("Employees", employees);
  addSheet("Payslips", payslips);
  addSheet("Statutory Payments", statutoryPayments);
  addSheet("Reminders Log", remindersLog);

  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `aj-wires-accounts-backup-${dateStamp}.xlsx`);
}
