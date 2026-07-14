"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Boxes } from "lucide-react";
import { subscribeToItems } from "@/lib/accounts/items";
import { subscribeToPurchases } from "@/lib/accounts/purchases";
import { subscribeToSales } from "@/lib/accounts/sales";
import { subscribeToCreditNotes } from "@/lib/accounts/credit-notes";
import { subscribeToDebitNotes } from "@/lib/accounts/debit-notes";
import { subscribeToProductionVouchers } from "@/lib/accounts/production";
import { computeStockSummary } from "@/lib/accounts/stock";
import { UNIT_LABELS, type Item, type Purchase, type Sale, type CreditNote, type DebitNote, type ProductionVoucher } from "@/lib/accounts/types";

const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 });

export function LowStockAlertsPanel() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [creditNotes, setCreditNotes] = React.useState<CreditNote[]>([]);
  const [debitNotes, setDebitNotes] = React.useState<DebitNote[]>([]);
  const [productionVouchers, setProductionVouchers] = React.useState<ProductionVoucher[]>([]);

  React.useEffect(() => subscribeToItems(setItems), []);
  React.useEffect(() => subscribeToPurchases(setPurchases), []);
  React.useEffect(() => subscribeToSales(setSales), []);
  React.useEffect(() => subscribeToCreditNotes(setCreditNotes), []);
  React.useEffect(() => subscribeToDebitNotes(setDebitNotes), []);
  React.useEffect(() => subscribeToProductionVouchers(setProductionVouchers), []);

  const summary = computeStockSummary(items, purchases, sales, creditNotes, debitNotes, productionVouchers);
  const lowStock = summary.filter((row) => {
    const item = items.find((i) => i.id === row.itemId);
    return item && item.reorderLevel > 0 && row.closingQty <= item.reorderLevel;
  });

  return (
    <Link
      href="/accounts/stock-ledger"
      className={`flex items-start gap-3 rounded-xl border p-4 transition-opacity hover:opacity-90 ${
        lowStock.length > 0
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      }`}
    >
      {lowStock.length > 0 ? <AlertTriangle className="size-5" /> : <CheckCircle2 className="size-5" />}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground"><Boxes className="size-4" /> Stock Levels</p>
        {lowStock.length === 0 ? (
          <p className="mt-0.5 text-sm">All items above reorder level.</p>
        ) : (
          <p className="mt-0.5 text-sm">
            {lowStock.length} item{lowStock.length === 1 ? "" : "s"} at or below reorder level —{" "}
            {lowStock.slice(0, 3).map((row) => `${row.itemName} (${num.format(row.closingQty)} ${UNIT_LABELS[row.unit as keyof typeof UNIT_LABELS]?.split(" ")[0]})`).join(", ")}
            {lowStock.length > 3 ? "…" : ""}
          </p>
        )}
      </div>
    </Link>
  );
}
