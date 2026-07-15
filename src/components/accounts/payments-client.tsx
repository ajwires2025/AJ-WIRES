"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Wallet, Trash2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";
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
import { PaymentFormDialog } from "@/components/accounts/payment-form-dialog";
import { ConfirmDeleteDialog } from "@/components/accounts/confirm-delete-dialog";
import { subscribeToPayments, deletePayment } from "@/lib/accounts/payments";
import { PAYMENT_METHOD_LABELS, type Payment, type PaymentDirection, type PaymentMethod } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function PaymentsClient({ user }: { user: SessionUser }) {
  const searchParams = useSearchParams();
  const initialDirection = searchParams.get("direction");
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [directionFilter, setDirectionFilter] = React.useState<"all" | PaymentDirection>(
    initialDirection === "received" || initialDirection === "paid" ? initialDirection : "all"
  );
  const [methodFilter, setMethodFilter] = React.useState<"all" | PaymentMethod>("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [deletingPayment, setDeletingPayment] = React.useState<Payment | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeToPayments((data) => {
      setPayments(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = payments.filter((p) => {
    const matchesDirection = directionFilter === "all" || p.direction === directionFilter;
    const matchesMethod = methodFilter === "all" || p.method === methodFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || p.partyName.toLowerCase().includes(q) || p.linkedNumber.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q);
    return matchesDirection && matchesMethod && matchesSearch;
  });

  const totalReceived = filtered.filter((p) => p.direction === "received").reduce((s, p) => s + p.amount, 0);
  const totalPaid = filtered.filter((p) => p.direction === "paid").reduce((s, p) => s + p.amount, 0);

  const methodCounts = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => ({
    method,
    count: payments.filter((p) => p.method === method).length,
  }));

  const handleDelete = async (payment: Payment) => {
    try {
      await deletePayment(payment);
      toast.success("Payment deleted and bill balance reversed");
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <Wallet className="size-6 text-gold" /> Payments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Received: {inr.format(totalReceived)} · Paid: {inr.format(totalPaid)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            By method (all payments): {methodCounts.map((m) => `${PAYMENT_METHOD_LABELS[m.method]} (${m.count})`).join(" · ")}
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
          <Plus className="size-4" /> Record Payment
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by party, bill number, or reference..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={directionFilter} onValueChange={(v) => setDirectionFilter(v as "all" | PaymentDirection)}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            <SelectItem value="received">Received (from customers)</SelectItem>
            <SelectItem value="paid">Paid (to suppliers)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={(v) => setMethodFilter(v as "all" | PaymentMethod)}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
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
          <p className="py-10 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{p.partyName}</p>
                  <p className="text-sm text-muted-foreground">{p.linkedNumber} · {p.paymentDate}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={`shrink-0 gap-1 ${p.direction === "received" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}
                >
                  {p.direction === "received" ? <ArrowDownCircle className="size-3.5" /> : <ArrowUpCircle className="size-3.5" />}
                  {p.direction === "received" ? "Received" : "Paid"}
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{PAYMENT_METHOD_LABELS[p.method]}</p>
                <p className="font-heading text-base font-bold text-foreground">{inr.format(p.amount)}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 w-full text-destructive hover:bg-destructive/10"
                onClick={() => setDeletingPayment(p)}
              >
                <Trash2 className="size-3.5" /> Delete
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-xl border border-border sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Direction</th>
                <th className="px-4 py-3 text-left">Party</th>
                <th className="px-4 py-3 text-left">Bill #</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No payments recorded yet.</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={p.direction === "received" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}
                      >
                        {p.direction === "received" ? <ArrowDownCircle className="size-3.5" /> : <ArrowUpCircle className="size-3.5" />}
                        {p.direction === "received" ? "Received" : "Paid"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{p.partyName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.linkedNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.paymentDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{PAYMENT_METHOD_LABELS[p.method]}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(p.amount)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingPayment(p)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaymentFormDialog open={formOpen} onOpenChange={setFormOpen} user={user} />
      <ConfirmDeleteDialog
        open={!!deletingPayment}
        onOpenChange={(open) => !open && setDeletingPayment(null)}
        title={`Delete this payment of ${deletingPayment ? inr.format(deletingPayment.amount) : ""}?`}
        description="This reverses the amount against the linked bill and restores its previous payment status."
        onConfirm={() => handleDelete(deletingPayment!)}
      />
    </div>
  );
}
