import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { logDeletion } from "@/lib/accounts/deletion-log";
import type { StatutoryPayment, StatutoryPaymentInput } from "@/lib/accounts/types";

const statutoryPaymentsCol = collection(db, "statutoryPayments");

export function subscribeToStatutoryPayments(onChange: (payments: StatutoryPayment[]) => void) {
  const q = query(statutoryPaymentsCol, orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as StatutoryPayment));
  });
}

export async function createStatutoryPayment(input: StatutoryPaymentInput, createdBy: string) {
  await addDoc(statutoryPaymentsCol, {
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
  });
}

export async function updateStatutoryPayment(id: string, input: StatutoryPaymentInput) {
  await updateDoc(doc(db, "statutoryPayments", id), { ...input });
}

export async function deleteStatutoryPayment(id: string, deletedBy: string, deletedByName: string) {
  const snap = await getDoc(doc(db, "statutoryPayments", id));
  const data = snap.data();
  await deleteDoc(doc(db, "statutoryPayments", id));
  await logDeletion({
    collectionName: "statutoryPayments",
    recordId: id,
    summary: data ? `${data.type} deposit — ₹${data.amount} (${data.period})` : id,
    deletedBy,
    deletedByName,
  });
}
