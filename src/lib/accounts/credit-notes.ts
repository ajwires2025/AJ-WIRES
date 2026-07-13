import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
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

export async function deleteCreditNote(id: string) {
  await deleteDoc(doc(db, "creditNotes", id));
}

// Total credit-noted against a given sale — used everywhere "outstanding"
// on that invoice is computed.
export function creditNotedTotal(notes: CreditNote[], saleId: string): number {
  return notes.filter((n) => n.linkedSaleId === saleId).reduce((sum, n) => sum + n.grandTotal, 0);
}
