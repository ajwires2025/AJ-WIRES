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
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { logDeletion } from "@/lib/accounts/deletion-log";
import type { Purchase, PurchaseInput } from "@/lib/accounts/types";

const purchasesCol = collection(db, "purchases");

export function subscribeToPurchases(onChange: (purchases: Purchase[]) => void) {
  const q = query(purchasesCol, orderBy("billDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Purchase));
  });
}

export async function getPurchase(id: string): Promise<Purchase | null> {
  const snap = await getDoc(doc(db, "purchases", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Purchase) : null;
}

export async function createPurchase(input: PurchaseInput, createdBy: string): Promise<string> {
  const docRef = await addDoc(purchasesCol, {
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updatePurchase(id: string, input: PurchaseInput) {
  await updateDoc(doc(db, "purchases", id), { ...input });
}

export async function deletePurchase(id: string, deletedBy: string, deletedByName: string) {
  const snap = await getDoc(doc(db, "purchases", id));
  const data = snap.data();
  await deleteDoc(doc(db, "purchases", id));
  await logDeletion({
    collectionName: "purchases",
    recordId: id,
    summary: data ? `Bill ${data.billNumber} — ${data.supplierName} — ₹${data.grandTotal}` : id,
    deletedBy,
    deletedByName,
  });
}

const MAX_BILL_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_BILL_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

export async function uploadPurchaseBillFile(
  purchaseId: string,
  file: File
): Promise<{ url: string; name: string }> {
  if (file.size > MAX_BILL_FILE_BYTES) {
    throw new Error("File is too large (max 10 MB).");
  }
  if (!ALLOWED_BILL_TYPES.includes(file.type)) {
    throw new Error("Only PDF, JPG, and PNG files are allowed.");
  }
  const path = `purchases/${purchaseId}/${Date.now()}-${file.name}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return { url, name: file.name };
}

export async function deletePurchaseBillFile(url: string) {
  try {
    await deleteObject(ref(storage, url));
  } catch {
    // File may already be gone or URL may be a plain download URL rather
    // than a storage path — safe to ignore on delete.
  }
}
