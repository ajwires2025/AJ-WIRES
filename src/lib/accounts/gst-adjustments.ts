import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { logDeletion } from "@/lib/accounts/deletion-log";
import type { GstAdjustment, GstAdjustmentInput } from "@/lib/accounts/types";

const gstAdjustmentsCol = collection(db, "gstAdjustments");

export function subscribeToGstAdjustments(onChange: (adjustments: GstAdjustment[]) => void) {
  const q = query(gstAdjustmentsCol, orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as GstAdjustment));
  });
}

export async function createGstAdjustment(input: GstAdjustmentInput, createdBy: string) {
  await addDoc(gstAdjustmentsCol, {
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
  });
}

export async function updateGstAdjustment(id: string, input: GstAdjustmentInput) {
  await updateDoc(doc(db, "gstAdjustments", id), { ...input });
}

export async function deleteGstAdjustment(id: string, deletedBy: string, deletedByName: string) {
  const snap = await getDoc(doc(db, "gstAdjustments", id));
  const data = snap.data();
  await deleteDoc(doc(db, "gstAdjustments", id));
  await logDeletion({
    collectionName: "gstAdjustments",
    recordId: id,
    summary: data ? `${data.category} — ${data.description} — ₹${round2((data.cgst || 0) + (data.sgst || 0) + (data.igst || 0))}` : id,
    deletedBy,
    deletedByName,
  });
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
