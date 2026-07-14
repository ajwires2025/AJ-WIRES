"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { buildGeneralLedger } from "@/lib/accounts/ledger";
import { buildStatementRows } from "@/lib/accounts/statement";
import type {
  Party,
  Purchase,
  Sale,
  Payment,
  Expense,
  JournalVoucher,
  CreditNote,
  DebitNote,
  TdsChallan,
  Payslip,
  StatutoryPayment,
} from "@/lib/accounts/types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function PartyStatementClient({ id }: { id: string }) {
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
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => subscribeToParties((d) => { setParties(d); setLoading(false); }), []);
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

  const party = parties.find((p) => p.id === id);

  const ledger = buildGeneralLedger(
    parties,
    purchases,
    sales,
    payments,
    expenses,
    journalVouchers,
    creditNotes,
    debitNotes,
    tdsChallans,
    payslips,
    statutoryPayments
  );
  const account = party ? ledger.find((a) => a.name === party.name) : undefined;
  const rows = account ? buildStatementRows(account) : [];
  const closingBalance = rows.length ? rows[rows.length - 1].balance : 0;

  if (loading) {
    return <p className="py-16 text-center text-muted-foreground">Loading...</p>;
  }

  if (!party) {
    return <p className="py-16 text-center text-muted-foreground">Party not found.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="outline" asChild>
          <Link href="/accounts/parties"><ArrowLeft className="size-4" /> Back to Parties</Link>
        </Button>
        <Button onClick={() => window.print()} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
          <Printer className="size-4" /> Print / Save as PDF
        </Button>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6 print:mt-0 print:rounded-none print:border-none print:p-0">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-6 text-gold" />
            <div>
              <p className="font-heading text-lg font-bold text-foreground">A.J. Wires</p>
              <p className="text-xs text-muted-foreground">Medchal, Hyderabad, Telangana</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading text-xl font-bold text-foreground">Statement of Account</p>
            <p className="text-sm text-muted-foreground">As of {new Date().toLocaleDateString("en-IN")}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Party</p>
            <p className="mt-1 font-medium text-foreground">{party.name}</p>
            {party.address && <p className="text-sm text-muted-foreground">{party.address}</p>}
            <p className="text-sm text-muted-foreground">{party.state}{party.gstin ? ` · GSTIN ${party.gstin}` : ""}</p>
            {(party.contactPerson || party.phone) && (
              <p className="text-sm text-muted-foreground">{[party.contactPerson, party.phone].filter(Boolean).join(" · ")}</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Closing Balance</p>
            <p className={`mt-1 font-heading text-2xl font-bold ${closingBalance >= 0 ? "text-foreground" : "text-emerald-600 dark:text-emerald-400"}`}>
              {inr.format(Math.abs(closingBalance))} {closingBalance >= 0 ? "Dr" : "Cr"}
            </p>
            <p className="text-xs text-muted-foreground">{closingBalance >= 0 ? "Owed to A.J. Wires" : "A.J. Wires owes this party"}</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-2 text-left">Date</th>
                <th className="py-2 text-left">Voucher</th>
                <th className="py-2 text-left">Reference</th>
                <th className="py-2 text-left">Narration</th>
                <th className="py-2 text-right">Debit</th>
                <th className="py-2 text-right">Credit</th>
                <th className="py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No transactions recorded for this party.</td></tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2">{r.date === "—" ? "Opening" : r.date}</td>
                    <td className="py-2">{r.voucherType}</td>
                    <td className="py-2">{r.refNumber}</td>
                    <td className="py-2 text-muted-foreground">{r.narration}</td>
                    <td className="py-2 text-right tabular-nums">{r.debit ? inr.format(r.debit) : ""}</td>
                    <td className="py-2 text-right tabular-nums">{r.credit ? inr.format(r.credit) : ""}</td>
                    <td className="py-2 text-right tabular-nums font-medium">
                      {inr.format(Math.abs(r.balance))} {r.balance >= 0 ? "Dr" : "Cr"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Dr = owed to A.J. Wires · Cr = owed by A.J. Wires. Generated from AJ Wires&apos; internal accounting system —
          not a GST invoice.
        </p>
      </div>
    </div>
  );
}
