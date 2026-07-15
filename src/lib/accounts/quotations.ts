import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getNextNumber } from "@/lib/accounts/invoice-number";
import { createSale } from "@/lib/accounts/sales";
import { logDeletion } from "@/lib/accounts/deletion-log";
import type { Quotation, QuotationInput, SaleInput } from "@/lib/accounts/types";

const quotationsCol = collection(db, "quotations");

export function subscribeToQuotations(onChange: (quotations: Quotation[]) => void) {
  const q = query(quotationsCol, orderBy("quoteDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Quotation));
  });
}

export async function getQuotation(id: string): Promise<Quotation | null> {
  const snap = await getDoc(doc(db, "quotations", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Quotation) : null;
}

export async function getNextQuoteNumber(date: Date = new Date()): Promise<string> {
  return getNextNumber("quotations", "QT", date);
}

export async function createQuotation(input: QuotationInput, createdBy: string): Promise<string> {
  const docRef = await addDoc(quotationsCol, {
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateQuotation(id: string, input: QuotationInput) {
  await updateDoc(doc(db, "quotations", id), { ...input });
}

export async function deleteQuotation(id: string, deletedBy: string, deletedByName: string) {
  const snap = await getDoc(doc(db, "quotations", id));
  const data = snap.data();
  await deleteDoc(doc(db, "quotations", id));
  await logDeletion({
    collectionName: "quotations",
    recordId: id,
    summary: data ? `Quotation ${data.quoteNumber} — ${data.customerName} — ₹${data.grandTotal}` : id,
    deletedBy,
    deletedByName,
  });
}

// Converts an accepted quotation into a real, numbered Sale invoice — a
// straight copy of the line items/totals, since Quotation and Sale share the
// same GST-line shape. The quotation itself is kept (marked "converted") for
// audit trail rather than deleted.
export async function convertQuotationToSale(quotation: Quotation, createdBy: string): Promise<string> {
  const invoiceNumber = await getNextNumber("sales", "AJW");
  const today = new Date().toISOString().slice(0, 10);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const cogsTotal = Math.round(quotation.items.reduce((sum, i) => sum + i.costPrice * i.quantity, 0) * 100) / 100;
  const grossProfit = Math.round((quotation.taxableValue - cogsTotal) * 100) / 100;
  const marginPercent = quotation.taxableValue > 0 ? Math.round((grossProfit / quotation.taxableValue) * 10000) / 100 : 0;

  const saleInput: SaleInput = {
    customerId: quotation.customerId,
    customerName: quotation.customerName,
    invoiceNumber,
    invoiceDate: today,
    dueDate: dueDate.toISOString().slice(0, 10),
    placeOfSupplyStateCode: quotation.placeOfSupplyStateCode,
    items: quotation.items,
    taxableValue: quotation.taxableValue,
    cgst: quotation.cgst,
    sgst: quotation.sgst,
    igst: quotation.igst,
    totalTax: quotation.totalTax,
    roundOff: quotation.roundOff,
    grandTotal: quotation.grandTotal,
    amountReceived: 0,
    tdsSection: "",
    tdsAmount: 0,
    paymentStatus: "unpaid",
    invoiceFileUrl: "",
    invoiceFileName: "",
    cogsTotal,
    grossProfit,
    marginPercent,
    notes: quotation.notes ? `${quotation.notes} (converted from quotation ${quotation.quoteNumber})` : `Converted from quotation ${quotation.quoteNumber}`,
  };

  const saleId = await createSale(saleInput, createdBy);
  await updateQuotation(quotation.id, {
    quoteNumber: quotation.quoteNumber,
    quoteDate: quotation.quoteDate,
    validUntil: quotation.validUntil,
    customerId: quotation.customerId,
    customerName: quotation.customerName,
    placeOfSupplyStateCode: quotation.placeOfSupplyStateCode,
    items: quotation.items,
    taxableValue: quotation.taxableValue,
    cgst: quotation.cgst,
    sgst: quotation.sgst,
    igst: quotation.igst,
    totalTax: quotation.totalTax,
    roundOff: quotation.roundOff,
    grandTotal: quotation.grandTotal,
    status: "converted",
    convertedSaleId: saleId,
    notes: quotation.notes,
  });
  return saleId;
}
