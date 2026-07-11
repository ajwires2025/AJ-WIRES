import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
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

export async function deleteParty(id: string) {
  await deleteDoc(doc(db, "parties", id));
}
