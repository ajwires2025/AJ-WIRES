"use client";

import * as React from "react";
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
import { PAYMENT_METHOD_LABELS, type Payment, type PaymentDirection } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function PaymentsClient({ user }: { user: SessionUser }) {
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [directionFilter, setDirectionFilter] = React.useState<"all" | PaymentDirection>("all");
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
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q || p.partyName.toLowerCase().includes(q) || p.linkedNumber.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q);
    return matchesDirection && matchesSearch;
  });

  const totalReceived = filtered.filter((p) => p.direction === "received").reduce((s, p) => s + p.amount, 0);
  const totalPaid = filtered.filter((p) => p.direction === "paid").reduce((s, p) => s + p.amount, 0);

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
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
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
