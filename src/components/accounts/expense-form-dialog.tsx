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
import { calcExpenseTax } from "@/lib/accounts/gst-calc";
import { calcTdsAmount } from "@/lib/accounts/tds";
import { createExpense, updateExpense } from "@/lib/accounts/expenses";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHOD_LABELS,
  TDS_SECTIONS,
  DEFAULT_TDS_RATES,
  type Expense,
  type ExpenseInput,
  type TdsSection,
} from "@/lib/accounts/types";

const expenseSchema = z.object({
  direction: z.enum(["expense", "income"]),
  category: z.string().min(1, "Select a category"),
  description: z.string().optional(),
  partyName: z.string().optional(),
  amount: z.number().min(0.01, "Enter an amount"),
  date: z.string().min(1, "Enter a date"),
  method: z.enum(["bank", "cash", "upi", "cheque"]),
  gstApplicable: z.boolean(),
  gstRate: z.number().min(0).max(100),
  tdsSection: z.union([z.enum(TDS_SECTIONS), z.literal("")]),
  tdsRatePercent: z.number().min(0).max(100),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof expenseSchema>;

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

function toInput(values: FormValues): ExpenseInput {
  const tax = calcExpenseTax(values.amount, values.gstRate, values.gstApplicable);
  // TDS only applies when WE are the one paying (deducting before payment) —
  // never on money coming in as other income.
  const tdsApplicable = values.direction === "expense" && values.tdsSection !== "";
  const tdsAmount = tdsApplicable ? calcTdsAmount(tax.taxableValue, values.tdsRatePercent) : 0;
  return {
    direction: values.direction,
    category: values.category,
    description: values.description ?? "",
    partyName: values.partyName ?? "",
    amount: values.amount,
    date: values.date,
    method: values.method,
    gstApplicable: values.gstApplicable,
    gstRate: values.gstApplicable ? values.gstRate : 0,
    ...tax,
    tdsSection: tdsApplicable ? values.tdsSection : "",
    tdsRatePercent: tdsApplicable ? values.tdsRatePercent : 0,
    tdsAmount,
    notes: values.notes ?? "",
  };
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  createdBy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  createdBy: string;
}) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      direction: "expense",
      category: "",
      description: "",
      partyName: "",
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      method: "cash",
      gstApplicable: false,
      gstRate: 18,
      tdsSection: "",
      tdsRatePercent: 10,
      notes: "",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    reset(
      expense
        ? {
            direction: expense.direction,
            category: expense.category,
            description: expense.description,
            partyName: expense.partyName,
            amount: expense.amount,
            date: expense.date,
            method: expense.method,
            gstApplicable: expense.gstApplicable,
            gstRate: expense.gstRate || 18,
            tdsSection: expense.tdsSection || "",
            tdsRatePercent: expense.tdsRatePercent || 10,
            notes: expense.notes,
          }
        : {
            direction: "expense",
            category: "",
            description: "",
            partyName: "",
            amount: 0,
            date: new Date().toISOString().slice(0, 10),
            method: "cash",
            gstApplicable: false,
            gstRate: 18,
            tdsSection: "",
            tdsRatePercent: 10,
            notes: "",
          }
    );
  }, [open, expense, reset]);

  const direction = watch("direction");
  const amount = watch("amount");
  const gstApplicable = watch("gstApplicable");
  const gstRate = watch("gstRate");
  const tdsSection = watch("tdsSection");
  const tdsRatePercent = watch("tdsRatePercent");
  const categories = direction === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const preview = calcExpenseTax(amount || 0, gstRate || 0, gstApplicable);
  const tdsPreviewAmount = direction === "expense" && tdsSection ? calcTdsAmount(preview.taxableValue, tdsRatePercent || 0) : 0;
  const netPayablePreview = preview.grandTotal - tdsPreviewAmount;

  const onSubmit = async (values: FormValues) => {
    try {
      const input = toInput(values);
      if (expense) {
        await updateExpense(expense.id, input);
        toast.success("Updated");
      } else {
        await createExpense(input, createdBy);
        toast.success(values.direction === "expense" ? "Expense recorded" : "Income recorded");
      }
      onOpenChange(false);
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit Entry" : "Record Expense / Income"}</DialogTitle>
          <DialogDescription>Day-to-day expenses and other income — not tied to a purchase or sales bill.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Type</Label>
              <Controller
                control={control}
                name="direction"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      setValue("category", "");
                    }}
                  >
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense (money out)</SelectItem>
                      <SelectItem value="income">Other Income (money in)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" className="mt-1.5" {...register("date")} />
            </div>

            <div className="sm:col-span-2">
              <Label>Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" className="mt-1.5" placeholder="e.g. Electricity bill for June" {...register("description")} />
            </div>

            <div>
              <Label htmlFor="partyName">Paid to / Received from</Label>
              <Input id="partyName" className="mt-1.5" placeholder="Optional — vendor/payer name" {...register("partyName")} />
            </div>

            <div>
              <Label htmlFor="amount">Amount (₹, before GST)</Label>
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

            <div className="flex items-center gap-2">
              <input
                id="gstApplicable"
                type="checkbox"
                className="size-4 cursor-pointer accent-gold"
                {...register("gstApplicable")}
              />
              <Label htmlFor="gstApplicable" className="cursor-pointer">GST applicable</Label>
            </div>

            {gstApplicable && (
              <div>
                <Label htmlFor="gstRate">GST rate (%)</Label>
                <Input id="gstRate" type="number" step="0.01" className="mt-1.5" {...register("gstRate", { valueAsNumber: true })} />
              </div>
            )}

            {direction === "expense" && (
              <>
                <div>
                  <Label>TDS deducted (section)</Label>
                  <Controller
                    control={control}
                    name="tdsSection"
                    render={({ field }) => (
                      <Select
                        value={field.value || "none"}
                        onValueChange={(v) => {
                          const section = v === "none" ? "" : (v as TdsSection);
                          field.onChange(section);
                          if (section) setValue("tdsRatePercent", DEFAULT_TDS_RATES[section]);
                        }}
                      >
                        <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No TDS</SelectItem>
                          {TDS_SECTIONS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                {tdsSection && (
                  <div>
                    <Label htmlFor="tdsRatePercent">TDS rate (%)</Label>
                    <Input id="tdsRatePercent" type="number" step="0.01" className="mt-1.5" {...register("tdsRatePercent", { valueAsNumber: true })} />
                  </div>
                )}
              </>
            )}

            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" className="mt-1.5" rows={2} {...register("notes")} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Taxable value</span><span>{inr.format(preview.taxableValue)}</span></div>
            {gstApplicable && (
              <>
                <div className="flex justify-between text-muted-foreground"><span>CGST</span><span>{inr.format(preview.cgst)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>SGST</span><span>{inr.format(preview.sgst)}</span></div>
              </>
            )}
            <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold text-foreground">
              <span>Total</span><span>{inr.format(preview.grandTotal)}</span>
            </div>
            {tdsPreviewAmount > 0 && (
              <>
                <div className="mt-1 flex justify-between text-muted-foreground"><span>Less: TDS withheld</span><span>({inr.format(tdsPreviewAmount)})</span></div>
                <div className="flex justify-between font-semibold text-foreground"><span>Net payable to vendor</span><span>{inr.format(netPayablePreview)}</span></div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : expense ? "Save changes" : "Save entry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
