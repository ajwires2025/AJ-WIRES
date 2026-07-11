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
import type { Sale, SaleInput } from "@/lib/accounts/types";

const salesCol = collection(db, "sales");

export function subscribeToSales(onChange: (sales: Sale[]) => void) {
  const q = query(salesCol, orderBy("invoiceDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Sale));
  });
}

export async function getSale(id: string): Promise<Sale | null> {
  const snap = await getDoc(doc(db, "sales", id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Sale) : null;
}

export async function createSale(input: SaleInput, createdBy: string): Promise<string> {
  const docRef = await addDoc(salesCol, {
    ...input,
    createdBy,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateSale(id: string, input: SaleInput) {
  await updateDoc(doc(db, "sales", id), { ...input });
}

export async function deleteSale(id: string) {
  await deleteDoc(doc(db, "sales", id));
}

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

export async function uploadSaleInvoiceFile(
  saleId: string,
  file: File
): Promise<{ url: string; name: string }> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File is too large (max 10 MB).");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only PDF, JPG, and PNG files are allowed.");
  }
  const path = `sales/${saleId}/${Date.now()}-${file.name}`;
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return { url, name: file.name };
}

export async function deleteSaleInvoiceFile(url: string) {
  try {
    await deleteObject(ref(storage, url));
  } catch {
    // Safe to ignore on delete.
  }
}
