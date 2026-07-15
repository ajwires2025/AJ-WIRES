import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { logDeletion } from "@/lib/accounts/deletion-log";
import type { JournalVoucher, JournalVoucherInput } from "@/lib/accounts/types";

const journalCol = collection(db, "journalVouchers");

export function subscribeToJournalVouchers(onChange: (vouchers: JournalVoucher[]) => void) {
  const q = query(journalCol, orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as JournalVoucher));
  });
}

export async function createJournalVoucher(input: JournalVoucherInput, createdBy: string) {
  if (Math.abs(input.totalDebit - input.totalCredit) > 0.01) {
    throw new Error("Journal voucher must balance — total debit must equal total credit.");
  }
  await addDoc(journalCol, {
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteJournalVoucher(id: string, deletedBy: string, deletedByName: string) {
  const snap = await getDoc(doc(db, "journalVouchers", id));
  const data = snap.data();
  await deleteDoc(doc(db, "journalVouchers", id));
  await logDeletion({
    collectionName: "journalVouchers",
    recordId: id,
    summary: data ? `${data.narration} — ₹${data.totalDebit}` : id,
    deletedBy,
    deletedByName,
  });
}
