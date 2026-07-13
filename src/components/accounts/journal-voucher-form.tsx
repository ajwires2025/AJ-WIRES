"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createJournalVoucher } from "@/lib/accounts/journal";
import type { SessionUser } from "@/lib/firebase/session";

const ACCOUNT_TYPE_LABELS = {
  asset: "Asset",
  liability: "Liability",
  income: "Income",
  expense: "Expense",
  party: "Party (customer/supplier)",
} as const;

const lineSchema = z.object({
  accountName: z.string().min(1, "Enter an account name"),
  accountType: z.enum(["asset", "liability", "income", "expense", "party"]),
  debit: z.number().min(0),
  credit: z.number().min(0),
});

const journalSchema = z.object({
  date: z.string().min(1, "Enter a date"),
  narration: z.string().min(1, "Enter a narration"),
  lines: z.array(lineSchema).min(2, "Add at least two lines"),
});

type FormValues = z.infer<typeof journalSchema>;

const emptyLine = { accountName: "", accountType: "expense" as const, debit: 0, credit: 0 };

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function JournalVoucherForm({ user }: { user: SessionUser }) {
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      narration: "",
      lines: [emptyLine, emptyLine],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = watch("lines");

  const totalDebit = Math.round(lines.reduce((s, l) => s + (Number(l.debit) || 0), 0) * 100) / 100;
  const totalCredit = Math.round(lines.reduce((s, l) => s + (Number(l.credit) || 0), 0) * 100) / 100;
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const onSubmit = async (values: FormValues) => {
    if (!balanced) {
      toast.error("Total debit must equal total credit before saving.");
      return;
    }
    try {
      await createJournalVoucher(
        { date: values.date, narration: values.narration, lines: values.lines, totalDebit, totalCredit },
        user.uid
      );
      toast.success("Journal voucher saved");
      router.push("/accounts/journal-vouchers");
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  };

  return (
    <div>
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
        <BookOpen className="size-6 text-gold" /> New Journal Voucher
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manual ledger adjustments — depreciation, provisions, write-offs, opening-balance corrections, or any
        other entry needed while closing the books. Every line posts straight to the General Ledger.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" className="mt-1.5" {...register("date")} />
            {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>}
          </div>
          <div>
            <Label htmlFor="narration">Narration</Label>
            <Input id="narration" className="mt-1.5" placeholder="e.g. Depreciation on machinery for the year" {...register("narration")} />
            {errors.narration && <p className="mt-1 text-xs text-destructive">{errors.narration.message}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-foreground">Lines</h2>
            <Button type="button" size="sm" variant="outline" onClick={() => append(emptyLine)}>
              <Plus className="size-4" /> Add Line
            </Button>
          </div>
          {errors.lines?.root && <p className="mt-2 text-xs text-destructive">{errors.lines.root.message}</p>}
          {errors.lines?.message && <p className="mt-2 text-xs text-destructive">{errors.lines.message}</p>}

          <div className="mt-4 space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto]">
                <div>
                  <Label className="text-xs">Account name</Label>
                  <Input className="mt-1" placeholder="e.g. Depreciation" {...register(`lines.${index}.accountName`)} />
                  {errors.lines?.[index]?.accountName && (
                    <p className="mt-1 text-xs text-destructive">{errors.lines[index]?.accountName?.message}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Account type</Label>
                  <Controller
                    control={control}
                    name={`lines.${index}.accountType`}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div>
                  <Label className="text-xs">Debit (₹)</Label>
                  <Input type="number" step="0.01" className="mt-1" {...register(`lines.${index}.debit`, { valueAsNumber: true })} />
                </div>
                <div>
                  <Label className="text-xs">Credit (₹)</Label>
                  <Input type="number" step="0.01" className="mt-1" {...register(`lines.${index}.credit`, { valueAsNumber: true })} />
                </div>
                <div className="flex items-end justify-end">
                  {fields.length > 2 && (
                    <Button type="button" size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col items-end gap-1 border-t border-border pt-4 text-sm">
            <div className="flex w-full max-w-xs justify-between text-muted-foreground">
              <span>Total Debit</span><span className="tabular-nums text-foreground">{inr.format(totalDebit)}</span>
            </div>
            <div className="flex w-full max-w-xs justify-between text-muted-foreground">
              <span>Total Credit</span><span className="tabular-nums text-foreground">{inr.format(totalCredit)}</span>
            </div>
            <p className={`mt-1 text-sm font-medium ${balanced ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
              {balanced ? "✓ Balanced" : `⚠ Out of balance by ${inr.format(Math.abs(totalDebit - totalCredit))}`}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/accounts/journal-vouchers")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !balanced} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Save Voucher"}
          </Button>
        </div>
      </form>
    </div>
  );
}
