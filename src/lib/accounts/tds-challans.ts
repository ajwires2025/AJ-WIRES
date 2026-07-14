import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { TdsChallan, TdsChallanInput } from "@/lib/accounts/types";

const tdsChallansCol = collection(db, "tdsChallans");

export function subscribeToTdsChallans(onChange: (challans: TdsChallan[]) => void) {
  const q = query(tdsChallansCol, orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as TdsChallan));
  });
}

export async function createTdsChallan(input: TdsChallanInput, createdBy: string) {
  await addDoc(tdsChallansCol, {
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
  });
}

export async function updateTdsChallan(id: string, input: TdsChallanInput) {
  await updateDoc(doc(db, "tdsChallans", id), { ...input });
}

export async function deleteTdsChallan(id: string) {
  await deleteDoc(doc(db, "tdsChallans", id));
}
