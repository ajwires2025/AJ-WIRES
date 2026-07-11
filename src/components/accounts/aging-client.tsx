"use client";

import * as React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { subscribeToSales } from "@/lib/accounts/sales";
import { subscribeToPurchases } from "@/lib/accounts/purchases";
import { daysOverdue, agingBucket } from "@/lib/accounts/aging";
import type { Sale, Purchase, AgingBucket, AgingRow } from "@/lib/accounts/types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const BUCKETS: AgingBucket[] = ["0-30", "31-60", "61-90", "90+"];

const BUCKET_BADGE: Record<AgingBucket, string> = {
  "0-30": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "31-60": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "61-90": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "90+": "bg-destructive/10 text-destructive",
};

function AgingTable({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: AgingRow[] }) {
  const bucketTotals = BUCKETS.reduce<Record<AgingBucket, number>>((acc, b) => {
    acc[b] = rows.filter((r) => r.bucket === b).reduce((s, r) => s + r.outstanding, 0);
    return acc;
  }, { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 });
  const total = rows.reduce((s, r) => s + r.outstanding, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
        {icon} {title}
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {BUCKETS.map((b) => (
          <div key={b} className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{b} days</p>
            <p className="mt-1 font-heading text-lg font-bold text-foreground">{inr.format(bucketTotals[b])}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2 text-left">Bill #</th>
              <th className="py-2 text-left">Party</th>
              <th className="py-2 text-left">Due date</th>
              <th className="py-2 text-right">Days overdue</th>
              <th className="py-2 text-left">Bucket</th>
              <th className="py-2 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="py-6 text-center text-muted-foreground">Nothing outstanding.</td></tr>
            ) : (
              rows
                .sort((a, b) => b.daysOverdue - a.daysOverdue)
                .map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 font-medium text-foreground">{r.number}</td>
                    <td className="py-2 text-muted-foreground">{r.partyName}</td>
                    <td className="py-2 text-muted-foreground">{r.dueDate}</td>
                    <td className="py-2 text-right tabular-nums">{r.daysOverdue}</td>
                    <td className="py-2">
                      <Badge variant="secondary" className={BUCKET_BADGE[r.bucket]}>{r.bucket}</Badge>
                    </td>
                    <td className="py-2 text-right tabular-nums text-foreground">{inr.format(r.outstanding)}</td>
                  </tr>
                ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-border font-semibold text-foreground">
                <td className="py-2" colSpan={5}>Total outstanding</td>
                <td className="py-2 text-right tabular-nums">{inr.format(total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export function AgingClient() {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);

  React.useEffect(() => subscribeToSales(setSales), []);
  React.useEffect(() => subscribeToPurchases(setPurchases), []);

  const receivables: AgingRow[] = sales
    .filter((s) => s.paymentStatus !== "paid")
    .map((s) => {
      const days = daysOverdue(s.dueDate);
      return {
        id: s.id,
        number: s.invoiceNumber,
        partyName: s.customerName,
        dueDate: s.dueDate,
        daysOverdue: days,
        bucket: agingBucket(days),
        outstanding: s.grandTotal - s.amountReceived,
      };
    });

  const payables: AgingRow[] = purchases
    .filter((p) => p.paymentStatus !== "paid")
    .map((p) => {
      const days = daysOverdue(p.dueDate);
      return {
        id: p.id,
        number: p.billNumber,
        partyName: p.supplierName,
        dueDate: p.dueDate,
        daysOverdue: days,
        bucket: agingBucket(days),
        outstanding: p.grandTotal - p.amountPaid,
      };
    });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Aging Report</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Outstanding receivables and payables, aged by days since due date.
      </p>

      <div className="mt-6 space-y-6">
        <AgingTable title="Receivables (customers owe you)" icon={<TrendingUp className="size-5 text-emerald-500" />} rows={receivables} />
        <AgingTable title="Payables (you owe suppliers)" icon={<TrendingDown className="size-5 text-destructive" />} rows={payables} />
      </div>
    </div>
  );
}
