"use client";

import * as React from "react";
import { BookOpen, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const TYPE_LABELS: Record<LedgerAccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  income: "Income",
  expense: "Expense",
  party: "Party",
};

const TYPE_BADGE: Record<LedgerAccountType, string> = {
  asset: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  liability: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  income: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  expense: "bg-destructive/10 text-destructive",
  party: "bg-gold/15 text-gold-light dark:text-gold",
};

export function GeneralLedgerClient() {
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
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | LedgerAccountType>("all");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  React.useEffect(() => subscribeToExpenses(setExpenses), []);
  React.useEffect(() => subscribeToJournalVouchers(setJournalVouchers), []);
  React.useEffect(() => subscribeToCreditNotes(setCreditNotes), []);
  React.useEffect(() => subscribeToDebitNotes(setDebitNotes), []);
  React.useEffect(() => subscribeToParties(setParties), []);
  React.useEffect(() => subscribeToPurchases(setPurchases), []);
  React.useEffect(() => subscribeToSales(setSales), []);
  React.useEffect(() => subscribeToPayments(setPayments), []);
  React.useEffect(() => subscribeToTdsChallans(setTdsChallans), []);
  React.useEffect(() => subscribeToPayslips(setPayslips), []);
  React.useEffect(() => subscribeToStatutoryPayments(setStatutoryPayments), []);

  const ledger = buildGeneralLedger(parties, purchases, sales, payments, expenses, journalVouchers, creditNotes, debitNotes, tdsChallans, payslips, statutoryPayments);
  const filtered = ledger.filter((acc) => {
    const matchesType = typeFilter === "all" || acc.type === typeFilter;
    const matchesSearch = acc.name.toLowerCase().includes(search.trim().toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalDebit = round2(ledger.reduce((s, a) => s + a.totalDebit, 0));
  const totalCredit = round2(ledger.reduce((s, a) => s + a.totalCredit, 0));

  function round2(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  return (
    <div>
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
        <BookOpen className="size-6 text-gold" /> General Ledger
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every purchase, sale, and payment posted as a balanced double-entry — Total Dr {inr.format(totalDebit)} · Total Cr {inr.format(totalCredit)}
        {Math.abs(totalDebit - totalCredit) > 0.01 && (
          <span className="ml-2 font-medium text-destructive">(out of balance — check data)</span>
        )}
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search ledger accounts..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | LedgerAccountType)}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left"></th>
                <th className="px-4 py-3 text-left">Ledger Account</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Total Dr</th>
                <th className="px-4 py-3 text-right">Total Cr</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No ledger accounts found.</td></tr>
              ) : (
                filtered.map((acc) => {
                  const isExpanded = expanded === acc.name;
                  return (
                    <React.Fragment key={acc.name}>
                      <tr className="cursor-pointer hover:bg-muted/30" onClick={() => setExpanded(isExpanded ? null : acc.name)}>
                        <td className="px-4 py-3 text-muted-foreground">
                          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{acc.name}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className={TYPE_BADGE[acc.type]}>{TYPE_LABELS[acc.type]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{inr.format(acc.totalDebit)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{inr.format(acc.totalCredit)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                          {inr.format(Math.abs(acc.balance))} {acc.balance >= 0 ? "Dr" : "Cr"}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-muted/20 px-4 py-4">
                            <div className="overflow-x-auto">
                              <table className="w-full min-w-[560px] text-xs">
                                <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  <tr>
                                    <th className="py-1.5 text-left">Date</th>
                                    <th className="py-1.5 text-left">Voucher</th>
                                    <th className="py-1.5 text-left">Reference</th>
                                    <th className="py-1.5 text-left">Narration</th>
                                    <th className="py-1.5 text-right">Debit</th>
                                    <th className="py-1.5 text-right">Credit</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                  {acc.entries.map((e, i) => (
                                    <tr key={i}>
                                      <td className="py-1.5">{e.date}</td>
                                      <td className="py-1.5">{e.voucherType}</td>
                                      <td className="py-1.5">{e.refNumber}</td>
                                      <td className="py-1.5 text-muted-foreground">{e.narration}</td>
                                      <td className="py-1.5 text-right tabular-nums">{e.debit ? inr.format(e.debit) : ""}</td>
                                      <td className="py-1.5 text-right tabular-nums">{e.credit ? inr.format(e.credit) : ""}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
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
