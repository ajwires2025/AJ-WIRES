"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { subscribeToParties } from "@/lib/accounts/parties";
import { subscribeToPurchases } from "@/lib/accounts/purchases";
import { subscribeToSales } from "@/lib/accounts/sales";
import { createPayment } from "@/lib/accounts/payments";
import { PAYMENT_METHOD_LABELS, type Party, type Purchase, type Sale } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const paymentSchema = z.object({
  direction: z.enum(["received", "paid"]),
  partyId: z.string().min(1, "Select a party"),
  linkedId: z.string().min(1, "Select a bill"),
  amount: z.number().min(0.01, "Enter an amount"),
  paymentDate: z.string().min(1, "Enter a date"),
  method: z.enum(["bank", "cash", "upi", "cheque"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof paymentSchema>;

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function PaymentFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SessionUser;
}) {
  const [parties, setParties] = React.useState<Party[]>([]);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);

  React.useEffect(() => subscribeToParties(setParties), []);
  React.useEffect(() => subscribeToPurchases(setPurchases), []);
  React.useEffect(() => subscribeToSales(setSales), []);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      direction: "received",
      partyId: "",
      linkedId: "",
      amount: 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      method: "bank",
      reference: "",
      notes: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      reset({
        direction: "received",
        partyId: "",
        linkedId: "",
        amount: 0,
        paymentDate: new Date().toISOString().slice(0, 10),
        method: "bank",
        reference: "",
        notes: "",
      });
    }
  }, [open, reset]);

  const direction = watch("direction");
  const partyId = watch("partyId");

  const eligibleParties = parties.filter((p) =>
    direction === "received" ? p.type === "customer" || p.type === "both" : p.type === "supplier" || p.type === "both"
  );

  const outstandingBills =
    direction === "received"
      ? sales.filter((s) => s.customerId === partyId && s.paymentStatus !== "paid")
      : purchases.filter((p) => p.supplierId === partyId && p.paymentStatus !== "paid");

  const selectedBillId = watch("linkedId");
  const selectedBill = outstandingBills.find((b) => b.id === selectedBillId);
  const remainingBalance = selectedBill
    ? selectedBill.grandTotal - ("amountReceived" in selectedBill ? selectedBill.amountReceived : selectedBill.amountPaid)
    : 0;

  const handleBillChange = (id: string) => {
    setValue("linkedId", id);
    const bill = outstandingBills.find((b) => b.id === id);
    if (bill) {
      const paidSoFar = "amountReceived" in bill ? bill.amountReceived : bill.amountPaid;
      setValue("amount", Math.round((bill.grandTotal - paidSoFar) * 100) / 100);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const party = parties.find((p) => p.id === values.partyId);
      const bill = outstandingBills.find((b) => b.id === values.linkedId);
      const linkedNumber = bill
        ? "invoiceNumber" in bill
          ? bill.invoiceNumber
          : bill.billNumber
        : "";

      await createPayment(
        {
          partyId: values.partyId,
          partyName: party?.name ?? "",
          direction: values.direction,
          linkedType: values.direction === "received" ? "sale" : "purchase",
          linkedId: values.linkedId,
          linkedNumber,
          amount: values.amount,
          paymentDate: values.paymentDate,
          method: values.method,
          reference: values.reference ?? "",
          notes: values.notes ?? "",
        },
        user.uid
      );
      toast.success("Payment recorded");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Log money received from a customer or paid to a supplier.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Direction</Label>
              <Controller
                control={control}
                name="direction"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue("partyId", "");
                      setValue("linkedId", "");
                    }}
                  >
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="received">Received (from customer)</SelectItem>
                      <SelectItem value="paid">Paid (to supplier)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label htmlFor="paymentDate">Payment date</Label>
              <Input id="paymentDate" type="date" className="mt-1.5" {...register("paymentDate")} />
            </div>

            <div className="sm:col-span-2">
              <Label>Party</Label>
              <Controller
                control={control}
                name="partyId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue("linkedId", "");
                    }}
                  >
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue placeholder="Select a party" /></SelectTrigger>
                    <SelectContent>
                      {eligibleParties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.partyId && <p className="mt-1 text-xs text-destructive">{errors.partyId.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <Label>Outstanding bill</Label>
              <Controller
                control={control}
                name="linkedId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={handleBillChange} disabled={!partyId}>
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue placeholder={partyId ? "Select a bill" : "Select a party first"} /></SelectTrigger>
                    <SelectContent>
                      {outstandingBills.map((b) => {
                        const number = "invoiceNumber" in b ? b.invoiceNumber : b.billNumber;
                        const paid = "amountReceived" in b ? b.amountReceived : b.amountPaid;
                        return (
                          <SelectItem key={b.id} value={b.id}>
                            {number} — outstanding {inr.format(b.grandTotal - paid)}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.linkedId && <p className="mt-1 text-xs text-destructive">{errors.linkedId.message}</p>}
              {selectedBill && (
                <p className="mt-1 text-xs text-muted-foreground">Remaining balance: {inr.format(remainingBalance)}</p>
              )}
            </div>

            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" step="0.01" className="mt-1.5" {...register("amount", { valueAsNumber: true })} />
              {errors.amount && <p className="mt-1 text-xs text-destructive">{errors.amount.message}</p>}
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

            <div className="sm:col-span-2">
              <Label htmlFor="reference">Reference (transaction ID, cheque no., etc.)</Label>
              <Input id="reference" className="mt-1.5" {...register("reference")} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" className="mt-1.5" rows={2} {...register("notes")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
