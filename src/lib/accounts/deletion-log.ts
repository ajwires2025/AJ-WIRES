import { addDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { DeletionLogEntry } from "@/lib/accounts/types";

const deletionLogCol = collection(db, "deletionLog");

export function subscribeToDeletionLog(onChange: (entries: DeletionLogEntry[]) => void) {
  const q = query(deletionLogCol, orderBy("deletedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as DeletionLogEntry));
  });
}

export async function logDeletion(entry: Omit<DeletionLogEntry, "id" | "deletedAt">) {
  await addDoc(deletionLogCol, {
    ...entry,
    deletedAt: new Date().toISOString(),
  });
}
