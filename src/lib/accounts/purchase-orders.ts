import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getNextNumber } from "@/lib/accounts/invoice-number";
import { createPurchase } from "@/lib/accounts/purchases";
import type { PurchaseOrder, PurchaseOrderInput, PurchaseInput } from "@/lib/accounts/types";

const purchaseOrdersCol = collection(db, "purchaseOrders");

export function subscribeToPurchaseOrders(onChange: (orders: PurchaseOrder[]) => void) {
  const q = query(purchaseOrdersCol, orderBy("poDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as PurchaseOrder));
  });
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrder | null> {
  const snap = await getDoc(doc(db, "purchaseOrders", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as PurchaseOrder) : null;
}

export async function getNextPoNumber(date: Date = new Date()): Promise<string> {
  return getNextNumber("purchaseOrders", "PO", date);
}

export async function createPurchaseOrder(input: PurchaseOrderInput, createdBy: string): Promise<string> {
  const docRef = await addDoc(purchaseOrdersCol, {
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updatePurchaseOrder(id: string, input: PurchaseOrderInput) {
  await updateDoc(doc(db, "purchaseOrders", id), { ...input });
}

export async function deletePurchaseOrder(id: string) {
  await deleteDoc(doc(db, "purchaseOrders", id));
}

// Converts a confirmed PO into a real Purchase bill once the supplier's
// actual bill arrives — a straight copy of line items/totals since
// PurchaseOrder and Purchase share the same GST-line shape. The PO itself is
// kept (marked "converted") for audit trail rather than deleted.
export async function convertPurchaseOrderToPurchase(
  po: PurchaseOrder,
  billNumber: string,
  createdBy: string
): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const purchaseInput: PurchaseInput = {
    supplierId: po.supplierId,
    supplierName: po.supplierName,
    billNumber,
    billDate: today,
    dueDate: dueDate.toISOString().slice(0, 10),
    placeOfSupplyStateCode: po.placeOfSupplyStateCode,
    items: po.items,
    taxableValue: po.taxableValue,
    cgst: po.cgst,
    sgst: po.sgst,
    igst: po.igst,
    totalTax: po.totalTax,
    roundOff: po.roundOff,
    grandTotal: po.grandTotal,
    amountPaid: 0,
    paymentStatus: "unpaid",
    billFileUrl: "",
    billFileName: "",
    notes: po.notes ? `${po.notes} (converted from PO ${po.poNumber})` : `Converted from PO ${po.poNumber}`,
  };

  const purchaseId = await createPurchase(purchaseInput, createdBy);
  await updatePurchaseOrder(po.id, {
    poNumber: po.poNumber,
    poDate: po.poDate,
    expectedDate: po.expectedDate,
    supplierId: po.supplierId,
    supplierName: po.supplierName,
    placeOfSupplyStateCode: po.placeOfSupplyStateCode,
    items: po.items,
    taxableValue: po.taxableValue,
    cgst: po.cgst,
    sgst: po.sgst,
    igst: po.igst,
    totalTax: po.totalTax,
    roundOff: po.roundOff,
    grandTotal: po.grandTotal,
    status: "converted",
    convertedPurchaseId: purchaseId,
    notes: po.notes,
  });
  return purchaseId;
}
