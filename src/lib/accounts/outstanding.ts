import type { Sale, Purchase, CreditNote, DebitNote } from "@/lib/accounts/types";
import { creditNotedTotal } from "@/lib/accounts/credit-notes";
import { debitNotedTotal } from "@/lib/accounts/debit-notes";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// TDS the customer deducted is settled (remitted to the government on our
// behalf under our PAN) — it never reaches our bank, but it isn't still
// owed either, so it nets off outstanding the same way a credit note does.
export function netSaleOutstanding(sale: Sale, creditNotes: CreditNote[]): number {
  return round2(sale.grandTotal - sale.amountReceived - (sale.tdsAmount || 0) - creditNotedTotal(creditNotes, sale.id));
}

export function netPurchaseOutstanding(purchase: Purchase, debitNotes: DebitNote[]): number {
  return round2(purchase.grandTotal - purchase.amountPaid - debitNotedTotal(debitNotes, purchase.id));
}
