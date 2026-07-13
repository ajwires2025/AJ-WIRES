"use client";

import * as React from "react";
import { Boxes, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { subscribeToItems } from "@/lib/accounts/items";
import { subscribeToPurchases } from "@/lib/accounts/purchases";
import { subscribeToSales } from "@/lib/accounts/sales";
import { subscribeToCreditNotes } from "@/lib/accounts/credit-notes";
import { subscribeToDebitNotes } from "@/lib/accounts/debit-notes";
import { computeStockSummary, computeItemStockLedger } from "@/lib/accounts/stock";
import { UNIT_LABELS, type Item, type Purchase, type Sale, type CreditNote, type DebitNote } from "@/lib/accounts/types";

const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 });
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

const TYPE_BADGE: Record<string, string> = {
  opening: "bg-muted text-muted-foreground",
  purchase: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  sale: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  sales_return: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  purchase_return: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

export function StockLedgerClient() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [creditNotes, setCreditNotes] = React.useState<CreditNote[]>([]);
  const [debitNotes, setDebitNotes] = React.useState<DebitNote[]>([]);
  const [search, setSearch] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => subscribeToItems(setItems), []);
  React.useEffect(() => subscribeToPurchases(setPurchases), []);
  React.useEffect(() => subscribeToSales(setSales), []);
  React.useEffect(() => subscribeToCreditNotes(setCreditNotes), []);
  React.useEffect(() => subscribeToDebitNotes(setDebitNotes), []);

  const summary = computeStockSummary(items, purchases, sales, creditNotes, debitNotes).filter((row) =>
    row.itemName.toLowerCase().includes(search.trim().toLowerCase())
  );

  const totalStockValue = summary.reduce((sum, row) => sum + row.closingValue, 0);

  return (
    <div>
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
        <Boxes className="size-6 text-gold" /> Stock Ledger
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Per-item stock movements from purchases (in) and sales (out), valued at weighted-average cost.
        Total stock value on hand: <span className="font-medium text-foreground">{inr.format(totalStockValue)}</span>
      </p>

      <div className="mt-6 relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search items..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left"></th>
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-right">Opening</th>
                <th className="px-4 py-3 text-right">In</th>
                <th className="px-4 py-3 text-right">Out</th>
                <th className="px-4 py-3 text-right">Closing Qty</th>
                <th className="px-4 py-3 text-right">Avg Cost</th>
                <th className="px-4 py-3 text-right">Stock Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summary.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No items found.</td></tr>
              ) : (
                summary.map((row) => {
                  const item = items.find((i) => i.id === row.itemId)!;
                  const isExpanded = expandedId === row.itemId;
                  return (
                    <React.Fragment key={row.itemId}>
                      <tr
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => setExpandedId(isExpanded ? null : row.itemId)}
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{row.itemName}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {num.format(row.openingStock)} {UNIT_LABELS[row.unit as keyof typeof UNIT_LABELS]?.split(" ")[0]}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{num.format(row.totalIn)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-destructive">{num.format(row.totalOut)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">{num.format(row.closingQty)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{inr.format(row.avgCost)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">{inr.format(row.closingValue)}</td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-muted/20 px-4 py-4">
                            <StockMovementDetail item={item} purchases={purchases} sales={sales} creditNotes={creditNotes} debitNotes={debitNotes} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StockMovementDetail({
  item,
  purchases,
  sales,
  creditNotes,
  debitNotes,
}: {
  item: Item;
  purchases: Purchase[];
  sales: Sale[];
  creditNotes: CreditNote[];
  debitNotes: DebitNote[];
}) {
  const movements = computeItemStockLedger(item, purchases, sales, creditNotes, debitNotes);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-xs">
        <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="py-1.5 text-left">Date</th>
            <th className="py-1.5 text-left">Type</th>
            <th className="py-1.5 text-left">Reference</th>
            <th className="py-1.5 text-left">Party</th>
            <th className="py-1.5 text-right">In</th>
            <th className="py-1.5 text-right">Out</th>
            <th className="py-1.5 text-right">Rate</th>
            <th className="py-1.5 text-right">Balance Qty</th>
            <th className="py-1.5 text-right">Balance Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {movements.map((m, i) => (
            <tr key={i}>
              <td className="py-1.5">{m.date}</td>
              <td className="py-1.5">
                <Badge variant="secondary" className={TYPE_BADGE[m.type]}>{m.type}</Badge>
              </td>
              <td className="py-1.5">{m.refNumber}</td>
              <td className="py-1.5 text-muted-foreground">{m.partyName}</td>
              <td className="py-1.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{m.qtyIn ? num.format(m.qtyIn) : ""}</td>
              <td className="py-1.5 text-right tabular-nums text-destructive">{m.qtyOut ? num.format(m.qtyOut) : ""}</td>
              <td className="py-1.5 text-right tabular-nums">{m.rate ? inr.format(m.rate) : ""}</td>
              <td className="py-1.5 text-right tabular-nums font-medium">{num.format(m.balanceQty)}</td>
              <td className="py-1.5 text-right tabular-nums font-medium">{inr.format(m.balanceValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
