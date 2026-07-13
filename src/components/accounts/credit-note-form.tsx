"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, FileMinus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToSales } from "@/lib/accounts/sales";
import { subscribeToItems } from "@/lib/accounts/items";
import { calcLine, calcBillTotals } from "@/lib/accounts/gst-calc";
import { getNextNumber } from "@/lib/accounts/invoice-number";
import { createCreditNote } from "@/lib/accounts/credit-notes";
import { UNIT_LABELS, type Sale, type Item } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const lineSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  description: z.string().min(1, "Enter a description"),
  hsnCode: z.string(),
  unit: z.enum(["kg", "meter", "roll", "piece"]),
  quantity: z.number().min(0.001, "Enter a quantity"),
  rate: z.number().min(0),
  gstRate: z.number().min(0).max(100),
});

const schema = z.object({
  linkedSaleId: z.string().min(1, "Select the original invoice"),
  noteDate: z.string().min(1, "Enter a date"),
  reason: z.string().min(1, "Enter a reason"),
  items: z.array(lineSchema).min(1, "Add at least one line"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const emptyLine = { itemId: "", description: "", hsnCode: "", unit: "kg" as const, quantity: 1, rate: 0, gstRate: 18 };

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function CreditNoteForm({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [items, setItems] = React.useState<Item[]>([]);

  React.useEffect(() => subscribeToSales(setSales), []);
  React.useEffect(() => subscribeToItems(setItems), []);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      linkedSaleId: "",
      noteDate: new Date().toISOString().slice(0, 10),
      reason: "",
      items: [emptyLine],
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const linkedSaleId = watch("linkedSaleId");
  const linkedSale = sales.find((s) => s.id === linkedSaleId);

  const computedLines = watchedItems.map((line) =>
    calcLine(Number(line.quantity) || 0, Number(line.rate) || 0, Number(line.gstRate) || 0, linkedSale?.placeOfSupplyStateCode ?? "36")
  );
  const totals = calcBillTotals(watchedItems.map((line, i) => ({ ...line, ...computedLines[i] })));

  const handleItemChange = (index: number, itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setValue(`items.${index}.itemId`, item.id);
    setValue(`items.${index}.description`, item.name);
    setValue(`items.${index}.hsnCode`, item.hsnCode);
    setValue(`items.${index}.unit`, item.unit);
    setValue(`items.${index}.gstRate`, item.gstRate);
    setValue(`items.${index}.rate`, item.defaultSalePrice);
  };

  const onSubmit = async (values: FormValues) => {
    const sale = sales.find((s) => s.id === values.linkedSaleId);
    if (!sale) return;
    try {
      const lines = values.items.map((line, i) => ({ ...line, ...computedLines[i] }));
      const billTotals = calcBillTotals(lines);
      const noteNumber = await getNextNumber("credit-notes", "CN");

      await createCreditNote(
        {
          noteNumber,
          noteDate: values.noteDate,
          customerId: sale.customerId,
          customerName: sale.customerName,
          linkedSaleId: sale.id,
          linkedInvoiceNumber: sale.invoiceNumber,
          reason: values.reason,
          items: lines,
          taxableValue: billTotals.taxableValue,
          cgst: billTotals.cgst,
          sgst: billTotals.sgst,
          igst: billTotals.igst,
          totalTax: billTotals.totalTax,
          grandTotal: billTotals.taxableValue + billTotals.totalTax,
          notes: values.notes ?? "",
        },
        user.uid
      );
      toast.success(`Credit note ${noteNumber} saved`);
      router.push("/accounts/credit-notes");
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  };

  return (
    <div>
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
        <FileMinus className="size-6 text-gold" /> New Credit Note
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Reduces what a customer owes against an existing invoice — sales return, price correction, or discount
        after the invoice was issued. The original invoice stays unchanged; this note is what net outstanding
        gets reduced by.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <div>
            <Label>Original invoice</Label>
            <Controller
              control={control}
              name="linkedSaleId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5 w-full"><SelectValue placeholder="Select an invoice" /></SelectTrigger>
                  <SelectContent>
                    {sales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.invoiceNumber} — {s.customerName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.linkedSaleId && <p className="mt-1 text-xs text-destructive">{errors.linkedSaleId.message}</p>}
          </div>
          <div>
            <Label htmlFor="noteDate">Note date</Label>
            <Input id="noteDate" type="date" className="mt-1.5" {...register("noteDate")} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="reason">Reason</Label>
            <Input id="reason" className="mt-1.5" placeholder="e.g. 2 rolls returned — damaged in transit" {...register("reason")} />
            {errors.reason && <p className="mt-1 text-xs text-destructive">{errors.reason.message}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-foreground">Lines</h2>
            <Button type="button" size="sm" variant="outline" onClick={() => append(emptyLine)}>
              <Plus className="size-4" /> Add Line
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1.6fr_0.7fr_0.7fr_0.6fr_auto]">
                <div>
                  <Label className="text-xs">Item</Label>
                  <Controller
                    control={control}
                    name={`items.${index}.itemId`}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={(v) => handleItemChange(index, v)}>
                        <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Select item" /></SelectTrigger>
                        <SelectContent>
                          {items.map((i) => (
                            <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.items?.[index]?.itemId && (
                    <p className="mt-1 text-xs text-destructive">{errors.items[index]?.itemId?.message}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Qty ({UNIT_LABELS[watchedItems[index]?.unit ?? "kg"]})</Label>
                  <Input type="number" step="0.001" className="mt-1" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                </div>
                <div>
                  <Label className="text-xs">Rate (₹)</Label>
                  <Input type="number" step="0.01" className="mt-1" {...register(`items.${index}.rate`, { valueAsNumber: true })} />
                </div>
                <div>
                  <Label className="text-xs">GST %</Label>
                  <Input type="number" step="0.01" className="mt-1" {...register(`items.${index}.gstRate`, { valueAsNumber: true })} />
                </div>
                <div className="flex items-end justify-end">
                  {fields.length > 1 && (
                    <Button type="button" size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col items-end gap-1 border-t border-border pt-4 text-sm">
            <div className="flex w-full max-w-xs justify-between text-muted-foreground"><span>Taxable Value</span><span className="tabular-nums text-foreground">{inr.format(totals.taxableValue)}</span></div>
            <div className="flex w-full max-w-xs justify-between text-muted-foreground"><span>CGST</span><span className="tabular-nums text-foreground">{inr.format(totals.cgst)}</span></div>
            <div className="flex w-full max-w-xs justify-between text-muted-foreground"><span>SGST</span><span className="tabular-nums text-foreground">{inr.format(totals.sgst)}</span></div>
            <div className="flex w-full max-w-xs justify-between text-muted-foreground"><span>IGST</span><span className="tabular-nums text-foreground">{inr.format(totals.igst)}</span></div>
            <div className="flex w-full max-w-xs justify-between border-t border-border pt-1 font-semibold text-foreground"><span>Total</span><span className="tabular-nums">{inr.format(totals.taxableValue + totals.totalTax)}</span></div>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" className="mt-1.5" rows={2} {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/accounts/credit-notes")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Save Credit Note"}
          </Button>
        </div>
      </form>
    </div>
  );
}
