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
import { logDeletion } from "@/lib/accounts/deletion-log";
import type { Expense, ExpenseInput } from "@/lib/accounts/types";

const expensesCol = collection(db, "expenses");

export function subscribeToExpenses(onChange: (expenses: Expense[]) => void) {
  const q = query(expensesCol, orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Expense));
  });
}

export async function createExpense(input: ExpenseInput, createdBy: string): Promise<string> {
  const docRef = await addDoc(expensesCol, {
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateExpense(id: string, input: ExpenseInput) {
  await updateDoc(doc(db, "expenses", id), { ...input });
}

export async function deleteExpense(id: string, deletedBy: string, deletedByName: string) {
  const snap = await getDoc(doc(db, "expenses", id));
  const data = snap.data();
  await deleteDoc(doc(db, "expenses", id));
  await logDeletion({
    collectionName: "expenses",
    recordId: id,
    summary: data ? `${data.category} — ₹${data.grandTotal} (${data.date})` : id,
    deletedBy,
    deletedByName,
  });
}
