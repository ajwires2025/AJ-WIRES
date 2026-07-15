import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { logDeletion } from "@/lib/accounts/deletion-log";
import { DEFAULT_ITEMS, type Item, type ItemInput } from "@/lib/accounts/types";

const itemsCol = collection(db, "items");

export function subscribeToItems(onChange: (items: Item[]) => void) {
  const q = query(itemsCol, orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Item));
  });
}

export async function createItem(input: ItemInput, createdBy: string) {
  await addDoc(itemsCol, {
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
  });
}

export async function updateItem(id: string, input: ItemInput) {
  await updateDoc(doc(db, "items", id), { ...input });
}

export async function deleteItem(id: string, deletedBy: string, deletedByName: string) {
  const snap = await getDoc(doc(db, "items", id));
  const data = snap.data();
  await deleteDoc(doc(db, "items", id));
  await logDeletion({
    collectionName: "items",
    recordId: id,
    summary: data ? `${data.name}` : id,
    deletedBy,
    deletedByName,
  });
}

export async function seedDefaultItems(createdBy: string) {
  const existing = await getDocs(itemsCol);
  if (!existing.empty) return;
  await Promise.all(DEFAULT_ITEMS.map((item) => createItem(item, createdBy)));
}
