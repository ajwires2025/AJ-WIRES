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
import { createStatutoryPayment, updateStatutoryPayment } from "@/lib/accounts/statutory-payments";
import { STATUTORY_PAYMENT_TYPE_LABELS, type StatutoryPayment, type StatutoryPaymentInput, type StatutoryPaymentType } from "@/lib/accounts/types";

const schema = z.object({
  date: z.string().min(1, "Enter a date"),
  type: z.enum(["PF", "ESI", "PT"]),
  amount: z.number().min(0.01, "Enter an amount"),
  referenceNumber: z.string().optional(),
  period: z.string().min(1, "Enter a period"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function toInput(values: FormValues): StatutoryPaymentInput {
  return {
    date: values.date,
    type: values.type,
    amount: values.amount,
    referenceNumber: values.referenceNumber ?? "",
    period: values.period,
    notes: values.notes ?? "",
  };
}

const DEFAULT_VALUES: FormValues = {
  date: new Date().toISOString().slice(0, 10),
  type: "PF",
  amount: 0,
  referenceNumber: "",
  period: new Date().toISOString().slice(0, 7),
  notes: "",
};

export function StatutoryPaymentFormDialog({
  open,
  onOpenChange,
  payment,
  createdBy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: StatutoryPayment | null;
  createdBy: string;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT_VALUES });

  React.useEffect(() => {
    if (!open) return;
    reset(
      payment
        ? {
            date: payment.date,
            type: payment.type,
            amount: payment.amount,
            referenceNumber: payment.referenceNumber,
            period: payment.period,
            notes: payment.notes,
          }
        : DEFAULT_VALUES
    );
  }, [open, payment, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      const input = toInput(values);
      if (payment) {
        await updateStatutoryPayment(payment.id, input);
        toast.success("Payment updated");
      } else {
        await createStatutoryPayment(input, createdBy);
        toast.success("Payment recorded");
      }
      onOpenChange(false);
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{payment ? "Edit Statutory Payment" : "Record Statutory Payment"}</DialogTitle>
          <DialogDescription>PF/ESI/Professional Tax deposit — reduces the corresponding payable liability.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="date">Deposit date</Label>
              <Input id="date" type="date" className="mt-1.5" {...register("date")} />
              {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>}
            </div>

            <div>
              <Label>Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v as StatutoryPaymentType)}>
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUTORY_PAYMENT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input id="amount" type="number" step="0.01" className="mt-1.5" {...register("amount", { valueAsNumber: true })} />
              {errors.amount && <p className="mt-1 text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div>
              <Label htmlFor="period">Period</Label>
              <Input id="period" className="mt-1.5" placeholder="e.g. 2026-07" {...register("period")} />
              {errors.period && <p className="mt-1 text-xs text-destructive">{errors.period.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="referenceNumber">Reference / receipt number</Label>
              <Input id="referenceNumber" className="mt-1.5" {...register("referenceNumber")} />
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
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : payment ? "Save changes" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
