"use client";

import * as React from "react";
import { Download, Receipt, Plus, Pencil, Trash2 } from "lucide-react";
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
import { TdsChallanFormDialog } from "@/components/accounts/tds-challan-form-dialog";
import { ConfirmDeleteDialog } from "@/components/accounts/confirm-delete-dialog";
import { subscribeToExpenses } from "@/lib/accounts/expenses";
import { subscribeToSales } from "@/lib/accounts/sales";
import { subscribeToTdsChallans, deleteTdsChallan } from "@/lib/accounts/tds-challans";
import { calcTdsSummary } from "@/lib/accounts/tds-summary";
import { downloadCsv } from "@/lib/accounts/csv";
import { currentMonthKey, lastMonthKeys, monthPeriod, financialYearPeriod, type Period } from "@/lib/accounts/period";
import { currentFinancialYearKey } from "@/lib/accounts/invoice-number";
import type { Expense, Sale, TdsChallan } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function TdsSummaryClient({ user }: { user: SessionUser }) {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [tdsChallans, setTdsChallans] = React.useState<TdsChallan[]>([]);
  const [periodMode, setPeriodMode] = React.useState<"month" | "fy">("month");
  const [monthKey, setMonthKey] = React.useState(currentMonthKey());
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingChallan, setEditingChallan] = React.useState<TdsChallan | null>(null);
  const [deletingChallan, setDeletingChallan] = React.useState<TdsChallan | null>(null);

  const canEdit = user.role === "admin" || user.role === "ca";

  React.useEffect(() => subscribeToExpenses(setExpenses), []);
  React.useEffect(() => subscribeToSales(setSales), []);
  React.useEffect(() => subscribeToTdsChallans(setTdsChallans), []);

  const period: Period = periodMode === "fy" ? financialYearPeriod() : monthPeriod(monthKey);
  const summary = calcTdsSummary(expenses, sales, tdsChallans, period);
  const monthOptions = lastMonthKeys(12).map((key) => ({ key, label: monthPeriod(key).label }));

  const challansInPeriod = tdsChallans.filter((c) => {
    const d = new Date(c.date);
    return d >= period.start && d <= period.end;
  });

  const handleDelete = async (challan: TdsChallan) => {
    try {
      await deleteTdsChallan(challan.id, user.uid, user.name);
      toast.success("Challan deleted");
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  const handleExport = () => {
    downloadCsv(`tds-summary-${periodMode === "fy" ? currentFinancialYearKey() : monthKey}.csv`, [
      { Line: "TDS Payable — deducted this period", Amount: summary.payableDeductedInPeriod },
      ...summary.payableBySection.map((s) => ({ Line: `Payable: ${s.section}`, Amount: s.amount })),
      { Line: "TDS Payable — deposited this period (challans)", Amount: summary.payableDepositedInPeriod },
      { Line: "TDS Payable — outstanding (all-time)", Amount: summary.payableOutstanding },
      { Line: "TDS Receivable — deducted this period", Amount: summary.receivableInPeriod },
      ...summary.receivableBySection.map((s) => ({ Line: `Receivable: ${s.section}`, Amount: s.amount })),
      { Line: "TDS Receivable — cumulative (all-time, for return filing)", Amount: summary.receivableCumulative },
    ]);
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <Receipt className="size-6 text-gold" /> TDS Summary
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {periodMode === "fy" ? `Financial Year ${currentFinancialYearKey()}` : period.label}
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
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" /> Export
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
        <p>
          Rates and sections are working defaults — confirm applicability, thresholds, and PAN-based rates with
          your CA. TDS Receivable figures should be cross-checked against Form 26AS before claiming credit.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">TDS Payable (deducted from vendors)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-destructive">{inr.format(summary.payableDeductedInPeriod)}</p>
          <p className="text-xs text-muted-foreground">Deducted this period</p>
          <div className="mt-4 space-y-1.5 text-sm">
            {summary.payableBySection.map((s) => (
              <div key={s.section} className="flex justify-between text-muted-foreground">
                <span>{s.section}</span><span className="tabular-nums text-foreground">{inr.format(s.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-1.5 text-muted-foreground">
              <span>Deposited this period</span><span className="tabular-nums text-foreground">{inr.format(summary.payableDepositedInPeriod)}</span>
            </div>
            <div className="flex justify-between font-semibold text-foreground">
              <span>Outstanding liability (all-time)</span><span className="tabular-nums">{inr.format(summary.payableOutstanding)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">TDS Receivable (deducted by customers)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{inr.format(summary.receivableInPeriod)}</p>
          <p className="text-xs text-muted-foreground">Deducted this period</p>
          <div className="mt-4 space-y-1.5 text-sm">
            {summary.receivableBySection.map((s) => (
              <div key={s.section} className="flex justify-between text-muted-foreground">
                <span>{s.section}</span><span className="tabular-nums text-foreground">{inr.format(s.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-1.5 font-semibold text-foreground">
              <span>Cumulative (all-time, for return filing)</span><span className="tabular-nums">{inr.format(summary.receivableCumulative)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">TDS Challans</h2>
            <p className="text-sm text-muted-foreground">Deposits made to the government against TDS Payable, {period.label}.</p>
          </div>
          {canEdit && (
            <Button
              size="sm"
              onClick={() => { setEditingChallan(null); setFormOpen(true); }}
              className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy"
            >
              <Plus className="size-4" /> Record Challan
            </Button>
          )}
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Section</th>
                  <th className="px-4 py-3 text-left">Quarter</th>
                  <th className="px-4 py-3 text-left">Challan #</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {challansInPeriod.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-muted-foreground">
                      No challans recorded for this period.
                    </td>
                  </tr>
                ) : (
                  challansInPeriod.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{c.date}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{c.section}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{c.quarter}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.challanSerialNumber}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(c.amount)}</td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button size="icon-sm" variant="ghost" onClick={() => { setEditingChallan(c); setFormOpen(true); }}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setDeletingChallan(c)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {canEdit && (
        <>
          <TdsChallanFormDialog open={formOpen} onOpenChange={setFormOpen} challan={editingChallan} createdBy={user.uid} />
          <ConfirmDeleteDialog
            open={!!deletingChallan}
            onOpenChange={(open) => !open && setDeletingChallan(null)}
            title="Delete this challan?"
            description="This can't be undone. It will be removed from the TDS Payable deposit history."
            onConfirm={() => handleDelete(deletingChallan!)}
          />
        </>
      )}
    </div>
  );
}
