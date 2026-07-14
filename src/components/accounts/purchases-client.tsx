"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, ShoppingCart } from "lucide-react";
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
import { subscribeToPurchases } from "@/lib/accounts/purchases";
import { PaymentStatusDialog } from "@/components/accounts/payment-status-dialog";
import { PAYMENT_STATUS_LABELS, type Purchase, type PaymentStatus } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const STATUS_BADGE: Record<PaymentStatus, string> = {
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  partial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  unpaid: "bg-destructive/10 text-destructive",
};

export function PurchasesClient({ user }: { user: SessionUser }) {
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | PaymentStatus>("all");
  const [statusEditing, setStatusEditing] = React.useState<Purchase | null>(null);

  // Both Admin and CA have full edit access.
  const canEdit = user.role === "admin" || user.role === "ca";

  React.useEffect(() => {
    const unsubscribe = subscribeToPurchases((data) => {
      setPurchases(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = purchases.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.paymentStatus === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || p.billNumber.toLowerCase().includes(q) || p.supplierName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const totalOutstanding = filtered.reduce((sum, p) => sum + (p.grandTotal - p.amountPaid), 0);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <ShoppingCart className="size-6 text-gold" /> Purchases
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bills received from suppliers. Outstanding across current view: {inr.format(totalOutstanding)}
          </p>
        </div>
        {canEdit && (
          <Button asChild className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
            <Link href="/accounts/purchases/new">
              <Plus className="size-4" /> Add Purchase Bill
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by bill number or supplier..."
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

      {/* Card layout below sm — 6 columns don't fit a phone screen. */}
      <div className="mt-6 space-y-2 sm:hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No purchases found.</p>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="rounded-lg border border-border p-3">
              <Link href={`/accounts/purchases/${p.id}`} className="block hover:opacity-90">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{p.billNumber}</p>
                    <p className="truncate text-sm text-muted-foreground">{p.supplierName}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <p className="text-sm text-muted-foreground">Due {p.dueDate}</p>
                  <p className="font-heading text-base font-bold text-foreground">{inr.format(p.grandTotal)}</p>
                </div>
              </Link>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => canEdit && setStatusEditing(p)}
                className="mt-2"
              >
                <Badge variant="secondary" className={`shrink-0 ${STATUS_BADGE[p.paymentStatus]} ${canEdit ? "cursor-pointer hover:opacity-80" : ""}`}>
                  {PAYMENT_STATUS_LABELS[p.paymentStatus]}
                </Badge>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-xl border border-border sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Bill #</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Bill date</th>
                <th className="px-4 py-3 text-left">Due date</th>
                <th className="px-4 py-3 text-right">Grand total</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No purchases found.</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="cursor-pointer hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link href={`/accounts/purchases/${p.id}`} className="hover:underline">{p.billNumber}</Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.supplierName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.billDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.dueDate}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(p.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <button type="button" disabled={!canEdit} onClick={() => canEdit && setStatusEditing(p)}>
                        <Badge variant="secondary" className={`${STATUS_BADGE[p.paymentStatus]} ${canEdit ? "cursor-pointer hover:opacity-80" : ""}`}>
                          {PAYMENT_STATUS_LABELS[p.paymentStatus]}
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
