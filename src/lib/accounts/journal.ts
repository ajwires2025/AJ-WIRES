import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
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

export async function deleteJournalVoucher(id: string) {
  await deleteDoc(doc(db, "journalVouchers", id));
}
