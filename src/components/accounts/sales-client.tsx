"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, Receipt } from "lucide-react";
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
import { subscribeToSales } from "@/lib/accounts/sales";
import { PaymentStatusDialog } from "@/components/accounts/payment-status-dialog";
import { PAYMENT_STATUS_LABELS, type Sale, type PaymentStatus } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const STATUS_BADGE: Record<PaymentStatus, string> = {
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  partial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  unpaid: "bg-destructive/10 text-destructive",
};

export function SalesClient({ user }: { user: SessionUser }) {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | PaymentStatus>("all");
  const [statusEditing, setStatusEditing] = React.useState<Sale | null>(null);

  // Both Admin and CA have full edit access.
  const canEdit = user.role === "admin" || user.role === "ca";

  React.useEffect(() => {
    const unsubscribe = subscribeToSales((data) => {
      setSales(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = sales.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.paymentStatus === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || s.invoiceNumber.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalOutstanding = filtered.reduce((sum, s) => sum + (s.grandTotal - s.amountReceived), 0);
  const totalProfit = filtered.reduce((sum, s) => sum + s.grossProfit, 0);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <Receipt className="size-6 text-gold" /> Sales
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invoices issued to customers. Outstanding: {inr.format(totalOutstanding)} · Gross profit: {inr.format(totalProfit)}
          </p>
        </div>
        {canEdit && (
          <Button asChild className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
            <Link href="/accounts/sales/new">
              <Plus className="size-4" /> Add Sales Invoice
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number or customer..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | PaymentStatus)}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Card layout below sm — 7 columns don't fit a phone screen. */}
      <div className="mt-6 space-y-2 sm:hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No sales invoices found.</p>
        ) : (
          filtered.map((s) => (
            <div key={s.id} className="rounded-lg border border-border p-3">
              <Link href={`/accounts/sales/${s.id}`} className="block hover:opacity-90">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{s.invoiceNumber}</p>
                    <p className="truncate text-sm text-muted-foreground">{s.customerName}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div className="text-sm text-muted-foreground">
                    <p>Due {s.dueDate}</p>
                    <p className="text-gold-light dark:text-gold">Profit: {inr.format(s.grossProfit)}</p>
                  </div>
                  <p className="font-heading text-base font-bold text-foreground">{inr.format(s.grandTotal)}</p>
                </div>
              </Link>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => canEdit && setStatusEditing(s)}
                className="mt-2"
              >
                <Badge variant="secondary" className={`shrink-0 ${STATUS_BADGE[s.paymentStatus]} ${canEdit ? "cursor-pointer hover:opacity-80" : ""}`}>
                  {PAYMENT_STATUS_LABELS[s.paymentStatus]}
                </Badge>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-xl border border-border sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Invoice #</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Invoice date</th>
                <th className="px-4 py-3 text-left">Due date</th>
                <th className="px-4 py-3 text-right">Grand total</th>
                <th className="px-4 py-3 text-right">Gross profit</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No sales invoices found.</td></tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="cursor-pointer hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link href={`/accounts/sales/${s.id}`} className="hover:underline">{s.invoiceNumber}</Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.customerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.invoiceDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.dueDate}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(s.grandTotal)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gold-light dark:text-gold">{inr.format(s.grossProfit)}</td>
                    <td className="px-4 py-3">
                      <button type="button" disabled={!canEdit} onClick={() => canEdit && setStatusEditing(s)}>
                        <Badge variant="secondary" className={`${STATUS_BADGE[s.paymentStatus]} ${canEdit ? "cursor-pointer hover:opacity-80" : ""}`}>
                          {PAYMENT_STATUS_LABELS[s.paymentStatus]}
                        </Badge>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canEdit && (
        <PaymentStatusDialog
          open={!!statusEditing}
          onOpenChange={(open) => !open && setStatusEditing(null)}
          bill={statusEditing}
          user={user}
        />
      )}
    </div>
  );
}
