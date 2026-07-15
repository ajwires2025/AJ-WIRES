import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { logDeletion } from "@/lib/accounts/deletion-log";
import type { ProductionVoucher, ProductionVoucherInput } from "@/lib/accounts/types";

const productionCol = collection(db, "productionVouchers");

export function subscribeToProductionVouchers(onChange: (vouchers: ProductionVoucher[]) => void) {
  const q = query(productionCol, orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as ProductionVoucher));
  });
}

export async function createProductionVoucher(input: ProductionVoucherInput, createdBy: string) {
  await addDoc(productionCol, { ...input, createdBy, createdAt: new Date().toISOString() });
}

export async function deleteProductionVoucher(id: string, deletedBy: string, deletedByName: string) {
  const snap = await getDoc(doc(db, "productionVouchers", id));
  const data = snap.data();
  await deleteDoc(doc(db, "productionVouchers", id));
  await logDeletion({
    collectionName: "productionVouchers",
    recordId: id,
    summary: data ? `Production of ${data.finishedItemName} — ${data.quantityProduced} ${data.unit}` : id,
    deletedBy,
    deletedByName,
  });
}
