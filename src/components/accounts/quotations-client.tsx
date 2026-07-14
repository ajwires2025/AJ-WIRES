"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToQuotations } from "@/lib/accounts/quotations";
import { QUOTATION_STATUS_LABELS, type Quotation, type QuotationStatus } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const STATUS_BADGE: Record<QuotationStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  accepted: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive",
  expired: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  converted: "bg-gold/10 text-gold-light dark:text-gold",
};

export function QuotationsClient({ user }: { user: SessionUser }) {
  const [quotations, setQuotations] = React.useState<Quotation[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | QuotationStatus>("all");

  const canEdit = user.role === "admin" || user.role === "ca";

  React.useEffect(() => {
    const unsubscribe = subscribeToQuotations((data) => {
      setQuotations(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = quotations.filter((q) => {
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    const s = search.trim().toLowerCase();
    const matchesSearch = !s || q.quoteNumber.toLowerCase().includes(s) || q.customerName.toLowerCase().includes(s);
    return matchesStatus && matchesSearch;
  });

  const openValue = filtered.filter((q) => q.status !== "rejected" && q.status !== "expired" && q.status !== "converted").reduce((sum, q) => sum + q.grandTotal, 0);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <FileSignature className="size-6 text-gold" /> Quotations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pre-invoice offers to customers. Open pipeline value: {inr.format(openValue)}
          </p>
        </div>
        {canEdit && (
          <Button asChild className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
            <Link href="/accounts/quotations/new">
              <Plus className="size-4" /> New Quotation
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by quote number or customer..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | QuotationStatus)}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(QUOTATION_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 space-y-2 sm:hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No quotations found.</p>
        ) : (
          filtered.map((q) => (
            <Link key={q.id} href={`/accounts/quotations/${q.id}`} className="block rounded-lg border border-border p-3 hover:bg-muted/30">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{q.quoteNumber}</p>
                  <p className="truncate text-sm text-muted-foreground">{q.customerName}</p>
                </div>
                <Badge variant="secondary" className={`shrink-0 ${STATUS_BADGE[q.status]}`}>{QUOTATION_STATUS_LABELS[q.status]}</Badge>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p className="text-sm text-muted-foreground">Valid until {q.validUntil}</p>
                <p className="font-heading text-base font-bold text-foreground">{inr.format(q.grandTotal)}</p>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-xl border border-border sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Quote #</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Quote date</th>
                <th className="px-4 py-3 text-left">Valid until</th>
                <th className="px-4 py-3 text-right">Grand total</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No quotations found.</td></tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link href={`/accounts/quotations/${q.id}`} className="hover:underline">{q.quoteNumber}</Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{q.customerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{q.quoteDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{q.validUntil}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(q.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={STATUS_BADGE[q.status]}>{QUOTATION_STATUS_LABELS[q.status]}</Badge>
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
