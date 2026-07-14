"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPayment } from "@/lib/accounts/payments";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, type Purchase, type Sale } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function isSale(bill: Purchase | Sale): bill is Sale {
  return "invoiceNumber" in bill;
}

const STATUS_BADGE = {
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  partial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  unpaid: "bg-destructive/10 text-destructive",
} as const;

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function PaymentStatusDialog({
  open,
  onOpenChange,
  bill,
  user,
  onUpdated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill: Purchase | Sale | null;
  user: SessionUser;
  onUpdated?: () => void;
}) {
  const sale = bill && isSale(bill) ? bill : null;
  const number = sale ? sale.invoiceNumber : (bill as Purchase | null)?.billNumber ?? "";
  const partyId = sale ? sale.customerId : (bill as Purchase | null)?.supplierId ?? "";
  const partyName = sale ? sale.customerName : (bill as Purchase | null)?.supplierName ?? "";
  const grandTotal = bill?.grandTotal ?? 0;
  const currentAmount = sale ? sale.amountReceived : (bill as Purchase | null)?.amountPaid ?? 0;
  // TDS the customer deducted is settled, not still outstanding.
  const tdsAmount = sale?.tdsAmount || 0;
  const outstanding = round2(grandTotal - currentAmount - tdsAmount);
  const direction: "received" | "paid" = sale ? "received" : "paid";
  const linkedType: "sale" | "purchase" = sale ? "sale" : "purchase";

  const schema = React.useMemo(
    () =>
      z.object({
        amount: z
          .number()
          .min(0.01, "Enter an amount")
          .max(Math.max(outstanding, 0.01), `Cannot exceed the outstanding balance of ${inr.format(Math.max(outstanding, 0))}`),
        paymentDate: z.string().min(1, "Enter a date"),
        method: z.enum(["bank", "cash", "upi", "cheque"]),
        reference: z.string().optional(),
        notes: z.string().optional(),
      }),
    [outstanding]
  );
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: Math.max(outstanding, 0),
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "bank",
      reference: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    reset({
      amount: Math.max(outstanding, 0),
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "bank",
      reference: "",
      notes: "",
    });
  }, [open, outstanding, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!bill) return;
    try {
      await createPayment(
        {
          partyId,
          partyName,
          direction,
          linkedType,
          linkedId: bill.id,
          linkedNumber: number,
          amount: values.amount,
          paymentDate: values.paymentDate,
          method: values.method,
          reference: values.reference ?? "",
          notes: values.notes ?? "",
        },
        user.uid
      );
      toast.success("Payment status updated");
      onOpenChange(false);
      onUpdated?.();
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  };

  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Payment Status — {number}</DialogTitle>
          <DialogDescription>
            {partyName} · Grand total {inr.format(grandTotal)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <div>
            <p className="text-muted-foreground">{sale ? "Received so far" : "Paid so far"}</p>
            <p className="font-semibold text-foreground">{inr.format(currentAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Outstanding</p>
            <p className="font-semibold text-foreground">{inr.format(Math.max(outstanding, 0))}</p>
          </div>
          <Badge variant="secondary" className={STATUS_BADGE[bill.paymentStatus]}>
            {PAYMENT_STATUS_LABELS[bill.paymentStatus]}
          </Badge>
        </div>

        {outstanding <= 0.01 ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" /> This bill is already fully {sale ? "received" : "paid"}.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <button
                    type="button"
                    className="text-xs font-medium text-gold hover:underline"
                    onClick={() => setValue("amount", Math.max(outstanding, 0))}
                  >
                    Full amount
                  </button>
                </div>
                <Input id="amount" type="number" step="0.01" className="mt-1.5" {...register("amount", { valueAsNumber: true })} />
                {errors.amount && <p className="mt-1 text-xs text-destructive">{errors.amount.message}</p>}
              </div>

              <div>
                <Label htmlFor="paymentDate">Date</Label>
                <Input id="paymentDate" type="date" className="mt-1.5" {...register("paymentDate")} />
              </div>

              <div>
                <Label>Method</Label>
                <Controller
                  control={control}
                  name="method"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" className="mt-1.5" placeholder="Transaction ID, cheque no." {...register("reference")} />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" className="mt-1.5" rows={2} {...register("notes")} />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              This records a payment against this bill, so it flows through Payments, Cash Flow, Aging, and the
              Dashboard automatically. To reduce or reverse an amount already recorded, delete the specific entry
              from the <Link href="/accounts/payments" className="text-gold hover:underline">Payments</Link> page.
            </p>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
