"use client";

import * as React from "react";
import { CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToPayments, setPaymentReconciled } from "@/lib/accounts/payments";
import { downloadCsv } from "@/lib/accounts/csv";
import { currentMonthKey, lastMonthKeys, monthPeriod, financialYearPeriod, inPeriod, type Period } from "@/lib/accounts/period";
import { currentFinancialYearKey } from "@/lib/accounts/invoice-number";
import { PAYMENT_METHOD_LABELS, type Payment } from "@/lib/accounts/types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function ReconciliationClient() {
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [periodMode, setPeriodMode] = React.useState<"month" | "fy">("month");
  const [monthKey, setMonthKey] = React.useState(currentMonthKey());

  React.useEffect(() => subscribeToPayments(setPayments), []);

  const period: Period = periodMode === "fy" ? financialYearPeriod() : monthPeriod(monthKey);
  const rows = payments
    .filter((p) => inPeriod(p.paymentDate, period))
    .sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));

  const reconciledTotal = rows.filter((r) => r.reconciled).reduce((s, r) => s + r.amount, 0);
  const unreconciledTotal = rows.filter((r) => !r.reconciled).reduce((s, r) => s + r.amount, 0);
  const monthOptions = lastMonthKeys(12).map((key) => ({ key, label: monthPeriod(key).label }));

  const handleToggle = async (payment: Payment) => {
    try {
      await setPaymentReconciled(payment.id, !payment.reconciled);
    } catch {
      toast.error("Couldn't update. Try again.");
    }
  };

  const handleExport = () => {
    downloadCsv(`reconciliation-${periodMode === "fy" ? currentFinancialYearKey() : monthKey}.csv`, rows.map((r) => ({
      Date: r.paymentDate,
      Party: r.partyName,
      Direction: r.direction,
      Method: PAYMENT_METHOD_LABELS[r.method],
      Reference: r.reference,
      Amount: r.amount,
      Reconciled: r.reconciled ? "Yes" : "No",
    })));
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <CheckCircle2 className="size-6 text-gold" /> Reconciliation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Flag each payment as reconciled against your bank/cash records.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={periodMode} onValueChange={(v) => setPeriodMode(v as "month" | "fy")}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="fy">This FY</SelectItem>
            </SelectContent>
          </Select>
          {periodMode === "month" && (
            <Select value={monthKey} onValueChange={setMonthKey}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" onClick={handleExport} disabled={rows.length === 0}>
            <Download className="size-4" /> Export
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:w-80">
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reconciled</p>
          <p className="mt-1 font-heading text-lg font-bold text-emerald-500">{inr.format(reconciledTotal)}</p>
        </div>
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unreconciled</p>
          <p className="mt-1 font-heading text-lg font-bold text-amber-500">{inr.format(unreconciledTotal)}</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Party</th>
                <th className="px-4 py-3 text-left">Direction</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Reconciled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No payments in this period.</td></tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{p.paymentDate}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{p.partyName}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={p.direction === "received" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}
                      >
                        {p.direction}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{PAYMENT_METHOD_LABELS[p.method]}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.reference || "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(p.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={p.reconciled}
                        onChange={() => handleToggle(p)}
                        className="size-4 cursor-pointer accent-gold"
                        aria-label={`Mark payment to ${p.partyName} as reconciled`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
