"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
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
import { derivePaymentStatus } from "@/lib/accounts/gst-calc";
import { updatePayslip } from "@/lib/accounts/payslips";
import type { Payslip, PayslipInput } from "@/lib/accounts/types";

const schema = z.object({
  basic: z.number().min(0),
  hra: z.number().min(0),
  conveyance: z.number().min(0),
  specialAllowance: z.number().min(0),
  otherAllowances: z.number(),
  pfEmployee: z.number().min(0),
  pfEmployer: z.number().min(0),
  esiEmployee: z.number().min(0),
  esiEmployer: z.number().min(0),
  professionalTax: z.number().min(0),
  tdsSalary: z.number().min(0),
  otherDeductions: z.number().min(0),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function PayslipFormDialog({
  open,
  onOpenChange,
  payslip,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payslip: Payslip | null;
}) {
  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      basic: 0,
      hra: 0,
      conveyance: 0,
      specialAllowance: 0,
      otherAllowances: 0,
      pfEmployee: 0,
      pfEmployer: 0,
      esiEmployee: 0,
      esiEmployer: 0,
      professionalTax: 0,
      tdsSalary: 0,
      otherDeductions: 0,
      notes: "",
    },
  });

  React.useEffect(() => {
    if (!open || !payslip) return;
    reset({
      basic: payslip.basic,
      hra: payslip.hra,
      conveyance: payslip.conveyance,
      specialAllowance: payslip.specialAllowance,
      otherAllowances: payslip.otherAllowances,
      pfEmployee: payslip.pfEmployee,
      pfEmployer: payslip.pfEmployer,
      esiEmployee: payslip.esiEmployee,
      esiEmployer: payslip.esiEmployer,
      professionalTax: payslip.professionalTax,
      tdsSalary: payslip.tdsSalary,
      otherDeductions: payslip.otherDeductions,
      notes: payslip.notes,
    });
  }, [open, payslip, reset]);

  const watched = watch();
  const grossPreview = round2(
    (Number(watched.basic) || 0) +
      (Number(watched.hra) || 0) +
      (Number(watched.conveyance) || 0) +
      (Number(watched.specialAllowance) || 0) +
      (Number(watched.otherAllowances) || 0)
  );
  const netPreview = round2(
    grossPreview -
      (Number(watched.pfEmployee) || 0) -
      (Number(watched.esiEmployee) || 0) -
      (Number(watched.professionalTax) || 0) -
      (Number(watched.tdsSalary) || 0) -
      (Number(watched.otherDeductions) || 0)
  );

  const onSubmit = async (values: FormValues) => {
    if (!payslip) return;
    try {
      const input: PayslipInput = {
        employeeId: payslip.employeeId,
        employeeName: payslip.employeeName,
        month: payslip.month,
        basic: values.basic,
        hra: values.hra,
        conveyance: values.conveyance,
        specialAllowance: values.specialAllowance,
        otherAllowances: values.otherAllowances,
        grossSalary: grossPreview,
        pfEmployee: values.pfEmployee,
        pfEmployer: values.pfEmployer,
        esiEmployee: values.esiEmployee,
        esiEmployer: values.esiEmployer,
        professionalTax: values.professionalTax,
        tdsSalary: values.tdsSalary,
        otherDeductions: values.otherDeductions,
        netSalary: netPreview,
        amountPaid: payslip.amountPaid,
        paymentStatus: derivePaymentStatus(netPreview, payslip.amountPaid),
        notes: values.notes ?? "",
      };
      await updatePayslip(payslip.id, input);
      toast.success("Payslip updated");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  };

  if (!payslip) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Payslip — {payslip.employeeName} ({payslip.month})</DialogTitle>
          <DialogDescription>Adjust for bonus, unpaid leave, or a manually-computed salary TDS.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="basic">Basic (₹)</Label>
              <Input id="basic" type="number" step="0.01" className="mt-1.5" {...register("basic", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="hra">HRA (₹)</Label>
              <Input id="hra" type="number" step="0.01" className="mt-1.5" {...register("hra", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="conveyance">Conveyance (₹)</Label>
              <Input id="conveyance" type="number" step="0.01" className="mt-1.5" {...register("conveyance", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="specialAllowance">Special allowance (₹)</Label>
              <Input id="specialAllowance" type="number" step="0.01" className="mt-1.5" {...register("specialAllowance", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="otherAllowances">Other allowances / bonus (₹)</Label>
              <Input id="otherAllowances" type="number" step="0.01" className="mt-1.5" {...register("otherAllowances", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="otherDeductions">Other deductions (₹)</Label>
              <Input id="otherDeductions" type="number" step="0.01" className="mt-1.5" {...register("otherDeductions", { valueAsNumber: true })} />
              <p className="mt-1 text-xs text-muted-foreground">Unpaid leave, advance recovery, etc.</p>
            </div>
            <div>
              <Label htmlFor="pfEmployee">PF — employee (₹)</Label>
              <Input id="pfEmployee" type="number" step="0.01" className="mt-1.5" {...register("pfEmployee", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="pfEmployer">PF — employer (₹)</Label>
              <Input id="pfEmployer" type="number" step="0.01" className="mt-1.5" {...register("pfEmployer", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="esiEmployee">ESI — employee (₹)</Label>
              <Input id="esiEmployee" type="number" step="0.01" className="mt-1.5" {...register("esiEmployee", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="esiEmployer">ESI — employer (₹)</Label>
              <Input id="esiEmployer" type="number" step="0.01" className="mt-1.5" {...register("esiEmployer", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="professionalTax">Professional tax (₹)</Label>
              <Input id="professionalTax" type="number" step="0.01" className="mt-1.5" {...register("professionalTax", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="tdsSalary">TDS on salary — 192B (₹)</Label>
              <Input id="tdsSalary" type="number" step="0.01" className="mt-1.5" {...register("tdsSalary", { valueAsNumber: true })} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" className="mt-1.5" rows={2} {...register("notes")} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Gross salary</span><span>{inr.format(grossPreview)}</span></div>
            <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold text-foreground">
              <span>Net salary</span><span>{inr.format(netPreview)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
