"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
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
import { createPayment } from "@/lib/accounts/payments";
import { PAYMENT_METHOD_LABELS, type Payslip } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

const schema = z.object({
  amount: z.number().min(0.01, "Enter an amount"),
  paymentDate: z.string().min(1, "Enter a date"),
  method: z.enum(["bank", "cash", "upi", "cheque"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function PaySalaryDialog({
  open,
  onOpenChange,
  payslip,
  user,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslip: Payslip | null;
  user: SessionUser;
}) {
  const outstanding = payslip ? round2(payslip.netSalary - payslip.amountPaid) : 0;

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
    if (!payslip) return;
    try {
      await createPayment(
        {
          partyId: payslip.employeeId,
          partyName: payslip.employeeName,
          direction: "paid",
          linkedType: "payslip",
          linkedId: payslip.id,
          linkedNumber: `${payslip.month} salary`,
          amount: values.amount,
          paymentDate: values.paymentDate,
          method: values.method,
          reference: values.reference ?? "",
          notes: values.notes ?? "",
        },
        user.uid
      );
      toast.success("Salary payment recorded");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  };

  if (!payslip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pay Salary — {payslip.employeeName} ({payslip.month})</DialogTitle>
          <DialogDescription>
            Net salary {inr.format(payslip.netSalary)} · Paid so far {inr.format(payslip.amountPaid)}
          </DialogDescription>
        </DialogHeader>

        {outstanding <= 0.01 ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" /> This payslip is already fully paid.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <button type="button" className="text-xs font-medium text-gold hover:underline" onClick={() => setValue("amount", outstanding)}>
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
                <Input id="reference" className="mt-1.5" placeholder="Transaction ID" {...register("reference")} />
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
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
