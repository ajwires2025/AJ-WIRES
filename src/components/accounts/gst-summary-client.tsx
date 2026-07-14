"use client";

import * as React from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToSales } from "@/lib/accounts/sales";
import { subscribeToPurchases } from "@/lib/accounts/purchases";
import { subscribeToCreditNotes } from "@/lib/accounts/credit-notes";
import { subscribeToDebitNotes } from "@/lib/accounts/debit-notes";
import { subscribeToExpenses } from "@/lib/accounts/expenses";
import { calcGstSummary, type GstTaxSplit } from "@/lib/accounts/gst-summary";
import { downloadCsv } from "@/lib/accounts/csv";
import { currentMonthKey, lastMonthKeys, monthPeriod, financialYearPeriod, type Period } from "@/lib/accounts/period";
import { currentFinancialYearKey } from "@/lib/accounts/invoice-number";
import type { Sale, Purchase, CreditNote, DebitNote, Expense } from "@/lib/accounts/types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

function SplitCard({ title, split, tone }: { title: string; split: GstTaxSplit; tone: "up" | "down" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tone === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
        {inr.format(split.taxableValue)}
      </p>
      <p className="text-xs text-muted-foreground">Taxable value</p>
      <div className="mt-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground"><span>CGST</span><span className="tabular-nums text-foreground">{inr.format(split.cgst)}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>SGST</span><span className="tabular-nums text-foreground">{inr.format(split.sgst)}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>IGST</span><span className="tabular-nums text-foreground">{inr.format(split.igst)}</span></div>
        <div className="flex justify-between border-t border-border pt-1.5 font-semibold text-foreground"><span>Total tax</span><span className="tabular-nums">{inr.format(split.cgst + split.sgst + split.igst)}</span></div>
      </div>
    </div>
  );
}

export function GstSummaryClient() {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [creditNotes, setCreditNotes] = React.useState<CreditNote[]>([]);
  const [debitNotes, setDebitNotes] = React.useState<DebitNote[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [periodMode, setPeriodMode] = React.useState<"month" | "fy">("month");
  const [monthKey, setMonthKey] = React.useState(currentMonthKey());

  React.useEffect(() => subscribeToSales(setSales), []);
  React.useEffect(() => subscribeToPurchases(setPurchases), []);
  React.useEffect(() => subscribeToCreditNotes(setCreditNotes), []);
  React.useEffect(() => subscribeToDebitNotes(setDebitNotes), []);
  React.useEffect(() => subscribeToExpenses(setExpenses), []);

  const period: Period = periodMode === "fy" ? financialYearPeriod() : monthPeriod(monthKey);
  const summary = calcGstSummary(sales, purchases, creditNotes, debitNotes, expenses, period);
  const monthOptions = lastMonthKeys(12).map((key) => ({ key, label: monthPeriod(key).label }));

  const handleExport = () => {
    downloadCsv(`gst-summary-${periodMode === "fy" ? currentFinancialYearKey() : monthKey}.csv`, [
      { Line: "Outward taxable value (sales, net of credit notes)", Amount: summary.outwardTaxable.taxableValue },
      { Line: "Outward CGST", Amount: summary.outwardTaxable.cgst },
      { Line: "Outward SGST", Amount: summary.outwardTaxable.sgst },
      { Line: "Outward IGST", Amount: summary.outwardTaxable.igst },
      { Line: "Inward taxable value (purchases + GST expenses, net of debit notes)", Amount: summary.inwardTaxable.taxableValue },
      { Line: "Inward CGST (ITC)", Amount: summary.inwardTaxable.cgst },
      { Line: "Inward SGST (ITC)", Amount: summary.inwardTaxable.sgst },
      { Line: "Inward IGST (ITC)", Amount: summary.inwardTaxable.igst },
      { Line: "Net CGST payable", Amount: summary.netCgst },
      { Line: "Net SGST payable", Amount: summary.netSgst },
      { Line: "Net IGST payable", Amount: summary.netIgst },
      { Line: "Net GST payable (negative = ITC carried forward)", Amount: summary.netPayable },
    ]);
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <FileSpreadsheet className="size-6 text-gold" /> GST Summary
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
          A working summary to hand to your CA for GSTR-1/GSTR-3B filing — not a filing itself. Reverse charge,
          blocked ITC (Sec 17(5)), and RCM liabilities are not modeled here and need your CA&apos;s review.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <SplitCard title="Outward Supplies (Sales)" split={summary.outwardTaxable} tone="up" />
        <SplitCard title="Inward Supplies — ITC (Purchases + Expenses)" split={summary.inwardTaxable} tone="down" />
      </div>

      <div className="mt-6 max-w-xl rounded-xl border border-border bg-card p-6">
        <p className="mb-3 text-sm font-semibold text-foreground">Net GST Position</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground"><span>Net CGST</span><span className="tabular-nums text-foreground">{inr.format(summary.netCgst)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Net SGST</span><span className="tabular-nums text-foreground">{inr.format(summary.netSgst)}</span></div>
          <div className="flex justify-between text-muted-foreground"><span>Net IGST</span><span className="tabular-nums text-foreground">{inr.format(summary.netIgst)}</span></div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
            <span>{summary.netPayable >= 0 ? "Net Payable" : "Net ITC Carried Forward"}</span>
            <span className="tabular-nums">{inr.format(Math.abs(summary.netPayable))}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
