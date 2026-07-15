"use client";

import * as React from "react";
import { History, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToDeletionLog } from "@/lib/accounts/deletion-log";
import type { DeletionLogEntry } from "@/lib/accounts/types";

const COLLECTION_LABELS: Record<string, string> = {
  parties: "Party",
  items: "Item",
  purchases: "Purchase",
  sales: "Sale",
  payments: "Payment",
  expenses: "Expense",
  journalVouchers: "Journal Voucher",
  creditNotes: "Credit Note",
  debitNotes: "Debit Note",
  productionVouchers: "Production Entry",
  gstAdjustments: "GST Adjustment",
  quotations: "Quotation",
  purchaseOrders: "Purchase Order",
  fixedAssets: "Fixed Asset",
  tdsChallans: "TDS Challan",
  employees: "Employee",
  payslips: "Payslip",
  statutoryPayments: "Statutory Payment",
};

export function DeletionLogClient() {
  const [entries, setEntries] = React.useState<DeletionLogEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [collectionFilter, setCollectionFilter] = React.useState("all");

  React.useEffect(() => {
    const unsubscribe = subscribeToDeletionLog((data) => {
      setEntries(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const collectionsPresent = Array.from(new Set(entries.map((e) => e.collectionName))).sort();

  const filtered = entries.filter((e) => {
    const matchesCollection = collectionFilter === "all" || e.collectionName === collectionFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || e.summary.toLowerCase().includes(q) || e.deletedByName.toLowerCase().includes(q);
    return matchesCollection && matchesSearch;
  });

  return (
    <div>
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
        <History className="size-6 text-gold" /> Deletion Log
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every record deleted anywhere in the app, with who deleted it and when. Deletions can&apos;t be undone from
        here — this is a record for accountability, not a recycle bin.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by record or who deleted it..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={collectionFilter} onValueChange={setCollectionFilter}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All record types</SelectItem>
            {collectionsPresent.map((c) => (
              <SelectItem key={c} value={c}>{COLLECTION_LABELS[c] ?? c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Deleted At</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Record</th>
                <th className="px-4 py-3 text-left">Deleted By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No deletions recorded yet.</td></tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{new Date(e.deletedAt).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{COLLECTION_LABELS[e.collectionName] ?? e.collectionName}</Badge></td>
                    <td className="px-4 py-3 text-foreground">{e.summary}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.deletedByName}</td>
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
