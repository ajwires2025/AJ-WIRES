"use client";

import * as React from "react";
import { Scale } from "lucide-react";
import { subscribeToParties } from "@/lib/accounts/parties";
import { subscribeToPurchases } from "@/lib/accounts/purchases";
import { subscribeToSales } from "@/lib/accounts/sales";
import { subscribeToPayments } from "@/lib/accounts/payments";
import { subscribeToExpenses } from "@/lib/accounts/expenses";
import { subscribeToJournalVouchers } from "@/lib/accounts/journal";
import { subscribeToCreditNotes } from "@/lib/accounts/credit-notes";
import { subscribeToDebitNotes } from "@/lib/accounts/debit-notes";
import { subscribeToTdsChallans } from "@/lib/accounts/tds-challans";
import { subscribeToPayslips } from "@/lib/accounts/payslips";
import { subscribeToStatutoryPayments } from "@/lib/accounts/statutory-payments";
import { buildGeneralLedger, type LedgerAccountType } from "@/lib/accounts/ledger";
import type { Party, Purchase, Sale, Payment, Expense, JournalVoucher, CreditNote, DebitNote, TdsChallan, Payslip, StatutoryPayment } from "@/lib/accounts/types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

const TYPE_ORDER: LedgerAccountType[] = ["asset", "liability", "party", "income", "expense"];
const TYPE_LABELS: Record<LedgerAccountType, string> = {
  asset: "Assets",
  liability: "Liabilities",
  party: "Parties (Debtors/Creditors)",
  income: "Income",
  expense: "Expenses",
};

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function TrialBalanceClient() {
  const [parties, setParties] = React.useState<Party[]>([]);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [journalVouchers, setJournalVouchers] = React.useState<JournalVoucher[]>([]);
  const [creditNotes, setCreditNotes] = React.useState<CreditNote[]>([]);
  const [debitNotes, setDebitNotes] = React.useState<DebitNote[]>([]);
  const [tdsChallans, setTdsChallans] = React.useState<TdsChallan[]>([]);
  const [payslips, setPayslips] = React.useState<Payslip[]>([]);
  const [statutoryPayments, setStatutoryPayments] = React.useState<StatutoryPayment[]>([]);

  React.useEffect(() => subscribeToParties(setParties), []);
  React.useEffect(() => subscribeToPurchases(setPurchases), []);
  React.useEffect(() => subscribeToSales(setSales), []);
  React.useEffect(() => subscribeToPayments(setPayments), []);
  React.useEffect(() => subscribeToExpenses(setExpenses), []);
  React.useEffect(() => subscribeToJournalVouchers(setJournalVouchers), []);
  React.useEffect(() => subscribeToCreditNotes(setCreditNotes), []);
  React.useEffect(() => subscribeToDebitNotes(setDebitNotes), []);
  React.useEffect(() => subscribeToTdsChallans(setTdsChallans), []);
  React.useEffect(() => subscribeToPayslips(setPayslips), []);
  React.useEffect(() => subscribeToStatutoryPayments(setStatutoryPayments), []);

  const ledger = buildGeneralLedger(parties, purchases, sales, payments, expenses, journalVouchers, creditNotes, debitNotes, tdsChallans, payslips, statutoryPayments);
  const totalDebit = round2(ledger.reduce((s, a) => s + (a.balance > 0 ? a.balance : 0), 0));
  const totalCredit = round2(ledger.reduce((s, a) => s + (a.balance < 0 ? -a.balance : 0), 0));
  const inBalance = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div>
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
        <Scale className="size-6 text-gold" /> Trial Balance
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Closing balance of every ledger account as of today, grouped by type.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Ledger Account</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ledger.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">No transactions recorded yet.</td></tr>
              ) : (
                TYPE_ORDER.map((type) => {
                  const rows = ledger.filter((a) => a.type === type);
                  if (rows.length === 0) return null;
                  return (
                    <React.Fragment key={type}>
                      <tr className="bg-muted/30">
                        <td colSpan={3} className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {TYPE_LABELS[type]}
                        </td>
                      </tr>
                      {rows.map((acc) => (
                        <tr key={acc.name}>
                          <td className="px-4 py-2 pl-8 text-foreground">{acc.name}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{acc.balance > 0 ? inr.format(acc.balance) : ""}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{acc.balance < 0 ? inr.format(-acc.balance) : ""}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            {ledger.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border font-semibold text-foreground">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right tabular-nums">{inr.format(totalDebit)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{inr.format(totalCredit)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {ledger.length > 0 && (
        <p className={`mt-3 text-sm font-medium ${inBalance ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
          {inBalance ? "✓ In balance — total debits equal total credits." : "⚠ Out of balance — check the general ledger for a data issue."}
        </p>
      )}
    </div>
  );
}
