import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
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

export async function deleteProductionVoucher(id: string) {
  await deleteDoc(doc(db, "productionVouchers", id));
}
