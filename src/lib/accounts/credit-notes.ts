import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { logDeletion } from "@/lib/accounts/deletion-log";
import type { CreditNote, CreditNoteInput } from "@/lib/accounts/types";

const creditNotesCol = collection(db, "creditNotes");

export function subscribeToCreditNotes(onChange: (notes: CreditNote[]) => void) {
  const q = query(creditNotesCol, orderBy("noteDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as CreditNote));
  });
}

export async function createCreditNote(input: CreditNoteInput, createdBy: string) {
  await addDoc(creditNotesCol, { ...input, createdBy, createdAt: new Date().toISOString() });
}

export async function deleteCreditNote(id: string, deletedBy: string, deletedByName: string) {
  const snap = await getDoc(doc(db, "creditNotes", id));
  const data = snap.data();
  await deleteDoc(doc(db, "creditNotes", id));
  await logDeletion({
    collectionName: "creditNotes",
    recordId: id,
    summary: data ? `Credit Note ${data.noteNumber} — ${data.customerName} — ₹${data.grandTotal}` : id,
    deletedBy,
    deletedByName,
  });
}

// Total credit-noted against a given sale — used everywhere "outstanding"
// on that invoice is computed.
export function creditNotedTotal(notes: CreditNote[], saleId: string): number {
  return notes.filter((n) => n.linkedSaleId === saleId).reduce((sum, n) => sum + n.grandTotal, 0);
}
