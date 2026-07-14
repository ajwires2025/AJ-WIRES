"use client";

import * as React from "react";
import { Download, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToPayments } from "@/lib/accounts/payments";
import { subscribeToExpenses } from "@/lib/accounts/expenses";
import { subscribeToTdsChallans } from "@/lib/accounts/tds-challans";
import { calcCashFlow } from "@/lib/accounts/cashflow";
import { downloadCsv } from "@/lib/accounts/csv";
import { currentMonthKey, lastMonthKeys, monthPeriod, financialYearPeriod, type Period } from "@/lib/accounts/period";
import { currentFinancialYearKey } from "@/lib/accounts/invoice-number";
import type { Payment, Expense, TdsChallan } from "@/lib/accounts/types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${bold ? "border-t border-border font-semibold text-foreground" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function CashFlowClient() {
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [tdsChallans, setTdsChallans] = React.useState<TdsChallan[]>([]);
  const [periodMode, setPeriodMode] = React.useState<"month" | "fy">("month");
  const [monthKey, setMonthKey] = React.useState(currentMonthKey());

  React.useEffect(() => subscribeToPayments(setPayments), []);
  React.useEffect(() => subscribeToExpenses(setExpenses), []);
  React.useEffect(() => subscribeToTdsChallans(setTdsChallans), []);

  const period: Period = periodMode === "fy" ? financialYearPeriod() : monthPeriod(monthKey);
  const cf = calcCashFlow(payments, expenses, tdsChallans, period);
  const monthOptions = lastMonthKeys(12).map((key) => ({ key, label: monthPeriod(key).label }));

  const handleExport = () => {
    downloadCsv(`cash-flow-${periodMode === "fy" ? currentFinancialYearKey() : monthKey}.csv`, [
      { Line: "Opening Cash", Amount: cf.openingCash },
      { Line: "Cash In (received)", Amount: cf.cashIn },
      { Line: "Cash Out (paid)", Amount: -cf.cashOut },
      { Line: "Net Cash Flow", Amount: cf.netCashFlow },
      { Line: "Closing Cash", Amount: cf.closingCash },
    ]);
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <Wallet className="size-6 text-gold" /> Cash Flow
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

      <p className="mt-4 text-sm text-muted-foreground">
        Based on recorded payments and expense/income entries — this is money in vs. money out through this
        system, not a bank reconciliation against your actual bank statement.
      </p>

      <div className="mt-6 max-w-xl rounded-xl border border-border bg-card p-6">
        <Row label="Opening cash" value={inr.format(cf.openingCash)} />
        <Row label="Cash in (received)" value={inr.format(cf.cashIn)} />
        <Row label="Cash out (paid)" value={`(${inr.format(cf.cashOut)})`} />
        <Row label="Net cash flow" value={inr.format(cf.netCashFlow)} bold />
        <Row label="Closing cash" value={inr.format(cf.closingCash)} bold />
      </div>
    </div>
  );
}
