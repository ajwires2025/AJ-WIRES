import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
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

export async function deleteStatutoryPayment(id: string) {
  await deleteDoc(doc(db, "statutoryPayments", id));
}
