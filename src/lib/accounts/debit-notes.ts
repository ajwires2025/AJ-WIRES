import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { logDeletion } from "@/lib/accounts/deletion-log";
import type { DebitNote, DebitNoteInput } from "@/lib/accounts/types";

const debitNotesCol = collection(db, "debitNotes");

export function subscribeToDebitNotes(onChange: (notes: DebitNote[]) => void) {
  const q = query(debitNotesCol, orderBy("noteDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as DebitNote));
  });
}

export async function createDebitNote(input: DebitNoteInput, createdBy: string) {
  await addDoc(debitNotesCol, { ...input, createdBy, createdAt: new Date().toISOString() });
}

export async function deleteDebitNote(id: string, deletedBy: string, deletedByName: string) {
  const snap = await getDoc(doc(db, "debitNotes", id));
  const data = snap.data();
  await deleteDoc(doc(db, "debitNotes", id));
  await logDeletion({
    collectionName: "debitNotes",
    recordId: id,
    summary: data ? `Debit Note ${data.noteNumber} — ${data.supplierName} — ₹${data.grandTotal}` : id,
    deletedBy,
    deletedByName,
  });
}

// Total debit-noted against a given purchase — used everywhere "outstanding"
// on that bill is computed.
export function debitNotedTotal(notes: DebitNote[], purchaseId: string): number {
  return notes.filter((n) => n.linkedPurchaseId === purchaseId).reduce((sum, n) => sum + n.grandTotal, 0);
}
