"use client";

import * as React from "react";
import { Landmark } from "lucide-react";
import { subscribeToParties } from "@/lib/accounts/parties";
import { subscribeToItems } from "@/lib/accounts/items";
import { subscribeToPurchases } from "@/lib/accounts/purchases";
import { subscribeToSales } from "@/lib/accounts/sales";
import { subscribeToPayments } from "@/lib/accounts/payments";
import { subscribeToExpenses } from "@/lib/accounts/expenses";
import { subscribeToJournalVouchers } from "@/lib/accounts/journal";
import { buildGeneralLedger } from "@/lib/accounts/ledger";
import { computeStockSummary } from "@/lib/accounts/stock";
import type { Party, Item, Purchase, Sale, Payment, Expense, JournalVoucher } from "@/lib/accounts/types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function Section({ title, rows, total }: { title: string; rows: { label: string; amount: number }[]; total: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-2 text-sm">
        {rows.length === 0 ? (
          <p className="text-muted-foreground">None</p>
        ) : (
          rows.map((r) => (
            <div key={r.label} className="flex justify-between">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="tabular-nums text-foreground">{inr.format(r.amount)}</span>
            </div>
          ))
        )}
        <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
          <span>Total</span>
          <span className="tabular-nums">{inr.format(total)}</span>
        </div>
      </div>
    </div>
  );
}

export function BalanceSheetClient() {
  const [parties, setParties] = React.useState<Party[]>([]);
  const [items, setItems] = React.useState<Item[]>([]);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [journalVouchers, setJournalVouchers] = React.useState<JournalVoucher[]>([]);

  React.useEffect(() => subscribeToParties(setParties), []);
  React.useEffect(() => subscribeToItems(setItems), []);
  React.useEffect(() => subscribeToPurchases(setPurchases), []);
  React.useEffect(() => subscribeToSales(setSales), []);
  React.useEffect(() => subscribeToPayments(setPayments), []);
  React.useEffect(() => subscribeToExpenses(setExpenses), []);
  React.useEffect(() => subscribeToJournalVouchers(setJournalVouchers), []);

  const ledger = buildGeneralLedger(parties, purchases, sales, payments, expenses, journalVouchers);
  const stockSummary = computeStockSummary(items, purchases, sales);

  const find = (name: string) => ledger.find((a) => a.name === name);
  const bank = find("Bank")?.balance ?? 0;
  const cash = find("Cash")?.balance ?? 0;
  const inputCgst = find("Input CGST")?.balance ?? 0;
  const inputSgst = find("Input SGST")?.balance ?? 0;
  const inputIgst = find("Input IGST")?.balance ?? 0;
  const outputCgst = -(find("Output CGST")?.balance ?? 0);
  const outputSgst = -(find("Output SGST")?.balance ?? 0);
  const outputIgst = -(find("Output IGST")?.balance ?? 0);
  const purchasesAmt = find("Purchases")?.balance ?? 0;
  const salesAmt = -(find("Sales")?.balance ?? 0);
  const roundOff = find("Round Off")?.balance ?? 0; // Dr-positive; negative means net credit (income)

  // Day-to-day expense/income entries post to dynamic, user-named ledger
  // accounts (one per category) rather than a single fixed one — so these
  // sum every "expense"/"income" account except Purchases/Sales, which are
  // already counted above.
  const otherExpenseTotal = round2(
    ledger.filter((a) => a.type === "expense" && a.name !== "Purchases" && a.name !== "Round Off").reduce((s, a) => s + a.balance, 0)
  );
  const otherIncomeTotal = round2(
    ledger.filter((a) => a.type === "income" && a.name !== "Sales").reduce((s, a) => s - a.balance, 0)
  );

  const debtors = ledger.filter((a) => a.type === "party" && a.balance > 0);
  const creditors = ledger.filter((a) => a.type === "party" && a.balance < 0);
  const totalDebtors = round2(debtors.reduce((s, a) => s + a.balance, 0));
  const totalCreditors = round2(creditors.reduce((s, a) => s - a.balance, 0));

  const openingStockValue = round2(items.reduce((s, i) => s + (i.openingStock ?? 0) * (i.defaultCostPrice ?? 0), 0));
  const closingStockValue = round2(stockSummary.reduce((s, r) => s + r.closingValue, 0));

  // Trading-account adjustment: unsold inventory isn't an expense yet.
  const cogs = round2(purchasesAmt + openingStockValue - closingStockValue);
  const netProfit = round2(salesAmt - cogs - roundOff + otherIncomeTotal - otherExpenseTotal);

  const assetRows = [
    { label: "Bank", amount: bank },
    { label: "Cash", amount: cash },
    { label: "Input CGST Receivable", amount: inputCgst },
    { label: "Input SGST Receivable", amount: inputSgst },
    ...(inputIgst ? [{ label: "Input IGST Receivable", amount: inputIgst }] : []),
    { label: "Sundry Debtors (customers owe you)", amount: totalDebtors },
    { label: "Closing Stock (Inventory)", amount: closingStockValue },
  ].filter((r) => r.amount !== 0);
  const totalAssets = round2(assetRows.reduce((s, r) => s + r.amount, 0));

  const liabilityRows = [
    { label: "Output CGST Payable", amount: outputCgst },
    { label: "Output SGST Payable", amount: outputSgst },
    ...(outputIgst ? [{ label: "Output IGST Payable", amount: outputIgst }] : []),
    { label: "Sundry Creditors (you owe suppliers)", amount: totalCreditors },
  ].filter((r) => r.amount !== 0);
  const totalLiabilities = round2(liabilityRows.reduce((s, r) => s + r.amount, 0));

  const equityRows = [
    { label: "Opening Capital (opening stock)", amount: openingStockValue },
    { label: "Net Profit (current)", amount: netProfit },
  ].filter((r) => r.amount !== 0);
  const totalEquity = round2(equityRows.reduce((s, r) => s + r.amount, 0));

  const inBalance = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

  return (
    <div>
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
        <Landmark className="size-6 text-gold" /> Balance Sheet
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        As of today. Unsold inventory (₹{closingStockValue.toLocaleString("en-IN")}) is carried as an asset rather than expensed, per standard trading-account treatment.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section title="Assets" rows={assetRows} total={totalAssets} />
        <div className="space-y-6">
          <Section title="Liabilities" rows={liabilityRows} total={totalLiabilities} />
          <Section title="Equity" rows={equityRows} total={totalEquity} />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="flex justify-between text-sm">
          <span className="font-medium text-muted-foreground">Total Assets</span>
          <span className="font-semibold tabular-nums text-foreground">{inr.format(totalAssets)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm">
          <span className="font-medium text-muted-foreground">Total Liabilities + Equity</span>
          <span className="font-semibold tabular-nums text-foreground">{inr.format(totalLiabilities + totalEquity)}</span>
        </div>
        <p className={`mt-3 text-sm font-medium ${inBalance ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
          {inBalance ? "✓ Balanced — Assets = Liabilities + Equity." : "⚠ Out of balance — check the general ledger and stock ledger for a data issue."}
        </p>
      </div>
    </div>
  );
}
