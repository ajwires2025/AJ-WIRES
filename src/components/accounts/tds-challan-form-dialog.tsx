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
import { createTdsChallan, updateTdsChallan } from "@/lib/accounts/tds-challans";
import { currentFinancialYearKey } from "@/lib/accounts/invoice-number";
import { TDS_SECTIONS, type TdsChallan, type TdsChallanInput } from "@/lib/accounts/types";

const schema = z.object({
  date: z.string().min(1, "Enter a date"),
  section: z.enum(TDS_SECTIONS),
  amount: z.number().min(0.01, "Enter an amount"),
  bsrCode: z.string().optional(),
  challanSerialNumber: z.string().optional(),
  quarter: z.string().min(1, "Enter a quarter"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function toInput(values: FormValues): TdsChallanInput {
  return {
    date: values.date,
    section: values.section,
    amount: values.amount,
    bsrCode: values.bsrCode ?? "",
    challanSerialNumber: values.challanSerialNumber ?? "",
    quarter: values.quarter,
    notes: values.notes ?? "",
  };
}

function defaultQuarter(date: Date = new Date()): string {
  const fyKey = currentFinancialYearKey(date);
  const month = date.getMonth(); // 0-indexed
  // Indian FY quarters: Q1 Apr-Jun, Q2 Jul-Sep, Q3 Oct-Dec, Q4 Jan-Mar.
  const q = month >= 3 && month <= 5 ? 1 : month >= 6 && month <= 8 ? 2 : month >= 9 && month <= 11 ? 3 : 4;
  return `Q${q} FY${fyKey}`;
}

const DEFAULT_VALUES: FormValues = {
  date: new Date().toISOString().slice(0, 10),
  section: "194J - Professional/Technical Fees",
  amount: 0,
  bsrCode: "",
  challanSerialNumber: "",
  quarter: defaultQuarter(),
  notes: "",
};

export function TdsChallanFormDialog({
  open,
  onOpenChange,
  challan,
  createdBy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challan: TdsChallan | null;
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
      challan
        ? {
            date: challan.date,
            section: challan.section,
            amount: challan.amount,
            bsrCode: challan.bsrCode,
            challanSerialNumber: challan.challanSerialNumber,
            quarter: challan.quarter,
            notes: challan.notes,
          }
        : DEFAULT_VALUES
    );
  }, [open, challan, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      const input = toInput(values);
      if (challan) {
        await updateTdsChallan(challan.id, input);
        toast.success("Challan updated");
      } else {
        await createTdsChallan(input, createdBy);
        toast.success("Challan recorded");
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
          <DialogTitle>{challan ? "Edit TDS Challan" : "Record TDS Challan"}</DialogTitle>
          <DialogDescription>Deposit of TDS withheld from vendor payments — reduces the TDS Payable liability.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="date">Deposit date</Label>
              <Input id="date" type="date" className="mt-1.5" {...register("date")} />
              {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>}
            </div>

            <div>
              <Label htmlFor="quarter">Quarter</Label>
              <Input id="quarter" className="mt-1.5" placeholder="e.g. Q1 FY2026-27" {...register("quarter")} />
              {errors.quarter && <p className="mt-1 text-xs text-destructive">{errors.quarter.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <Label>Section</Label>
              <Controller
                control={control}
                name="section"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TDS_SECTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
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
              <Label htmlFor="bsrCode">BSR code</Label>
              <Input id="bsrCode" className="mt-1.5" {...register("bsrCode")} />
            </div>

            <div>
              <Label htmlFor="challanSerialNumber">Challan serial number</Label>
              <Input id="challanSerialNumber" className="mt-1.5" {...register("challanSerialNumber")} />
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
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : challan ? "Save changes" : "Record challan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
