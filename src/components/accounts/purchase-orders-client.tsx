"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, ClipboardList } from "lucide-react";
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
import { subscribeToPurchaseOrders } from "@/lib/accounts/purchase-orders";
import { PURCHASE_ORDER_STATUS_LABELS, type PurchaseOrder, type PurchaseOrderStatus } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const STATUS_BADGE: Record<PurchaseOrderStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  confirmed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-destructive/10 text-destructive",
  converted: "bg-gold/10 text-gold-light dark:text-gold",
};

export function PurchaseOrdersClient({ user }: { user: SessionUser }) {
  const [orders, setOrders] = React.useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | PurchaseOrderStatus>("all");

  const canEdit = user.role === "admin" || user.role === "ca";

  React.useEffect(() => {
    const unsubscribe = subscribeToPurchaseOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const s = search.trim().toLowerCase();
    const matchesSearch = !s || o.poNumber.toLowerCase().includes(s) || o.supplierName.toLowerCase().includes(s);
    return matchesStatus && matchesSearch;
  });

  const openValue = filtered.filter((o) => o.status !== "cancelled" && o.status !== "converted").reduce((sum, o) => sum + o.grandTotal, 0);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <ClipboardList className="size-6 text-gold" /> Purchase Orders
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pre-bill commitments to suppliers. Open commitment value: {inr.format(openValue)}
          </p>
        </div>
        {canEdit && (
          <Button asChild className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
            <Link href="/accounts/purchase-orders/new">
              <Plus className="size-4" /> New Purchase Order
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by PO number or supplier..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | PurchaseOrderStatus)}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(PURCHASE_ORDER_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 space-y-2 sm:hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No purchase orders found.</p>
        ) : (
          filtered.map((o) => (
            <Link key={o.id} href={`/accounts/purchase-orders/${o.id}`} className="block rounded-lg border border-border p-3 hover:bg-muted/30">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{o.poNumber}</p>
                  <p className="truncate text-sm text-muted-foreground">{o.supplierName}</p>
                </div>
                <Badge variant="secondary" className={`shrink-0 ${STATUS_BADGE[o.status]}`}>{PURCHASE_ORDER_STATUS_LABELS[o.status]}</Badge>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <p className="text-sm text-muted-foreground">Expected {o.expectedDate}</p>
                <p className="font-heading text-base font-bold text-foreground">{inr.format(o.grandTotal)}</p>
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
                <th className="px-4 py-3 text-left">PO #</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">PO date</th>
                <th className="px-4 py-3 text-left">Expected</th>
                <th className="px-4 py-3 text-right">Grand total</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No purchase orders found.</td></tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link href={`/accounts/purchase-orders/${o.id}`} className="hover:underline">{o.poNumber}</Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{o.supplierName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.poDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.expectedDate}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(o.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={STATUS_BADGE[o.status]}>{PURCHASE_ORDER_STATUS_LABELS[o.status]}</Badge>
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
