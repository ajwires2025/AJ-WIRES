import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { derivePaymentStatus } from "@/lib/accounts/gst-calc";
import type { Payment, PaymentInput } from "@/lib/accounts/types";

const paymentsCol = collection(db, "payments");

export function subscribeToPayments(onChange: (payments: Payment[]) => void) {
  const q = query(paymentsCol, orderBy("paymentDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Payment));
  });
}

async function applyAmountDelta(linkedType: "sale" | "purchase", linkedId: string, delta: number) {
  const collectionName = linkedType === "sale" ? "sales" : "purchases";
  const amountField = linkedType === "sale" ? "amountReceived" : "amountPaid";
  const billRef = doc(db, collectionName, linkedId);
  const snap = await getDoc(billRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const grandTotal = data.grandTotal as number;
  const currentAmount = (data[amountField] as number) ?? 0;
  const newAmount = Math.max(0, currentAmount + delta);
  const paymentStatus = derivePaymentStatus(grandTotal, newAmount);

  await updateDoc(billRef, { [amountField]: newAmount, paymentStatus });
}

// Recording a payment both logs it and updates the linked bill's paid/received
// amount + status — the bill form's own amount field stays in sync this way.
export async function createPayment(input: PaymentInput, createdBy: string): Promise<string> {
  const docRef = await addDoc(paymentsCol, {
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
  });
  await applyAmountDelta(input.linkedType, input.linkedId, input.amount);
  return docRef.id;
}

export async function deletePayment(payment: Payment) {
  await deleteDoc(doc(db, "payments", payment.id));
  await applyAmountDelta(payment.linkedType, payment.linkedId, -payment.amount);
}
