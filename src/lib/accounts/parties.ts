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
import type { Party, PartyInput } from "@/lib/accounts/types";

const partiesCol = collection(db, "parties");

export function subscribeToParties(onChange: (parties: Party[]) => void) {
  const q = query(partiesCol, orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Party));
  });
}

export async function createParty(input: PartyInput, createdBy: string) {
  await addDoc(partiesCol, {
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
  });
}

export async function updateParty(id: string, input: PartyInput) {
  await updateDoc(doc(db, "parties", id), { ...input });
}

export async function deleteParty(id: string, deletedBy: string, deletedByName: string) {
  const snap = await getDoc(doc(db, "parties", id));
  const data = snap.data();
  await deleteDoc(doc(db, "parties", id));
  await logDeletion({
    collectionName: "parties",
    recordId: id,
    summary: data ? `${data.name} (${data.type})` : id,
    deletedBy,
    deletedByName,
  });
}
