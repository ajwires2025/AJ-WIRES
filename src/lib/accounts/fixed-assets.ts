import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { createExpense } from "@/lib/accounts/expenses";
import { CAPITAL_EXPENDITURE_CATEGORY, type FixedAsset, type FixedAssetInput } from "@/lib/accounts/types";
import type { PaymentMethod } from "@/lib/accounts/types";

const fixedAssetsCol = collection(db, "fixedAssets");

export function subscribeToFixedAssets(onChange: (assets: FixedAsset[]) => void) {
  const q = query(fixedAssetsCol, orderBy("purchaseDate", "desc"));
  return onSnapshot(q, (snapshot) => {
    onChange(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as FixedAsset));
  });
}

// Optionally books the cash outflow as an Expense (Capital Expenditure
// category, excluded from P&L — see types.ts) in the same step, so buying an
// asset doesn't require a separate manual entry.
export async function createFixedAsset(
  input: FixedAssetInput,
  createdBy: string,
  recordCashPayment?: { method: PaymentMethod }
): Promise<string> {
  let linkedExpenseId = input.linkedExpenseId;
  if (recordCashPayment) {
    linkedExpenseId = await createExpense(
      {
        direction: "expense",
        category: CAPITAL_EXPENDITURE_CATEGORY,
        description: `Purchase of ${input.assetName}`,
        partyName: input.vendorName,
        amount: input.purchaseCost,
        date: input.purchaseDate,
        method: recordCashPayment.method,
        gstApplicable: false,
        gstRate: 0,
        taxableValue: input.purchaseCost,
        cgst: 0,
        sgst: 0,
        igst: 0,
        totalTax: 0,
        grandTotal: input.purchaseCost,
        tdsSection: "",
        tdsRatePercent: 0,
        tdsAmount: 0,
        notes: `Auto-recorded from Fixed Asset register.`,
      },
      createdBy
    );
  }

  const docRef = await addDoc(fixedAssetsCol, {
    ...input,
    linkedExpenseId,
    createdBy,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function updateFixedAsset(id: string, input: FixedAssetInput) {
  await updateDoc(doc(db, "fixedAssets", id), { ...input });
}

export async function deleteFixedAsset(id: string) {
  await deleteDoc(doc(db, "fixedAssets", id));
}
