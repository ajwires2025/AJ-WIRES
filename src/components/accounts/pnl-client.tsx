"use client";

import * as React from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToSales } from "@/lib/accounts/sales";
import { subscribeToExpenses } from "@/lib/accounts/expenses";
import { subscribeToFixedAssets } from "@/lib/accounts/fixed-assets";
import { subscribeToPayslips } from "@/lib/accounts/payslips";
import { calcProfitAndLoss } from "@/lib/accounts/pnl";
import { downloadCsv } from "@/lib/accounts/csv";
import { currentMonthKey, lastMonthKeys, monthPeriod, financialYearPeriod, type Period } from "@/lib/accounts/period";
import { currentFinancialYearKey } from "@/lib/accounts/invoice-number";
import type { Sale, Expense, FixedAsset, Payslip } from "@/lib/accounts/types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

function Row({ label, value, bold = false, indent = false }: { label: string; value: string; bold?: boolean; indent?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${bold ? "border-t border-border font-semibold text-foreground" : "text-muted-foreground"}`}>
      <span className={indent ? "pl-4" : ""}>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function PnlClient() {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [fixedAssets, setFixedAssets] = React.useState<FixedAsset[]>([]);
  const [payslips, setPayslips] = React.useState<Payslip[]>([]);
  const [periodMode, setPeriodMode] = React.useState<"month" | "fy">("month");
  const [monthKey, setMonthKey] = React.useState(currentMonthKey());

  React.useEffect(() => subscribeToSales(setSales), []);
  React.useEffect(() => subscribeToExpenses(setExpenses), []);
  React.useEffect(() => subscribeToFixedAssets(setFixedAssets), []);
  React.useEffect(() => subscribeToPayslips(setPayslips), []);

  const period: Period = periodMode === "fy" ? financialYearPeriod() : monthPeriod(monthKey);
  const pnl = calcProfitAndLoss(sales, expenses, fixedAssets, payslips, period);
  const monthOptions = lastMonthKeys(12).map((key) => ({ key, label: monthPeriod(key).label }));

  const handleExport = () => {
    downloadCsv(`profit-and-loss-${periodMode === "fy" ? currentFinancialYearKey() : monthKey}.csv`, [
      { Line: "Revenue (taxable sales value)", Amount: pnl.revenue },
      { Line: "Cost of Goods Sold", Amount: -pnl.cogs },
      { Line: "Gross Profit", Amount: pnl.grossProfit },
      { Line: "Gross Margin %", Amount: pnl.grossMarginPercent },
      ...pnl.otherIncomeByCategory.map((c) => ({ Line: `Other Income: ${c.category}`, Amount: c.amount })),
      { Line: "Total Other Income", Amount: pnl.otherIncome },
      ...pnl.expensesByCategory.map((c) => ({ Line: `Expense: ${c.category}`, Amount: -c.amount })),
      { Line: "Total Expenses", Amount: -pnl.totalExpenses },
      { Line: "Net Profit", Amount: pnl.netProfit },
    ]);
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <FileText className="size-6 text-gold" /> Profit &amp; Loss
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
          GST is excluded (it&apos;s a pass-through liability, not revenue/expense). Confirm with your CA before
          treating this as final.
        </p>
      </div>

      <div className="mt-6 max-w-xl rounded-xl border border-border bg-card p-6">
        <Row label="Revenue (taxable sales value)" value={inr.format(pnl.revenue)} />
        <Row label="Less: Cost of Goods Sold" value={`(${inr.format(pnl.cogs)})`} indent />
        <Row label="Gross Profit" value={inr.format(pnl.grossProfit)} bold />
        <Row label="Gross Margin %" value={`${pnl.grossMarginPercent}%`} />

        {pnl.otherIncomeByCategory.map((c) => (
          <Row key={c.category} label={`Add: ${c.category}`} value={inr.format(c.amount)} indent />
        ))}
        {pnl.expensesByCategory.map((c) => (
          <Row key={c.category} label={`Less: ${c.category}`} value={`(${inr.format(c.amount)})`} indent />
        ))}

        <Row label="Net Profit" value={inr.format(pnl.netProfit)} bold />
      </div>
    </div>
  );
}
