import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
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

export async function deleteGstAdjustment(id: string) {
  await deleteDoc(doc(db, "gstAdjustments", id));
}
