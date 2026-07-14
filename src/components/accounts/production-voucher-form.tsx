"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Factory, TriangleAlert } from "lucide-react";
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
import { subscribeToItems } from "@/lib/accounts/items";
import { subscribeToPurchases } from "@/lib/accounts/purchases";
import { subscribeToSales } from "@/lib/accounts/sales";
import { subscribeToCreditNotes } from "@/lib/accounts/credit-notes";
import { subscribeToDebitNotes } from "@/lib/accounts/debit-notes";
import { subscribeToProductionVouchers, createProductionVoucher } from "@/lib/accounts/production";
import { computeStockSummary } from "@/lib/accounts/stock";
import { UNIT_LABELS, type Item, type Purchase, type Sale, type CreditNote, type DebitNote, type ProductionVoucher } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const schema = z.object({
  finishedItemId: z.string().min(1, "Select a finished good"),
  date: z.string().min(1, "Enter a date"),
  quantityProduced: z.number().min(0.001, "Enter a quantity"),
  additionalCost: z.number().min(0),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 });
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function ProductionVoucherForm({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [items, setItems] = React.useState<Item[]>([]);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [creditNotes, setCreditNotes] = React.useState<CreditNote[]>([]);
  const [debitNotes, setDebitNotes] = React.useState<DebitNote[]>([]);
  const [productionVouchers, setProductionVouchers] = React.useState<ProductionVoucher[]>([]);

  React.useEffect(() => subscribeToItems(setItems), []);
  React.useEffect(() => subscribeToPurchases(setPurchases), []);
  React.useEffect(() => subscribeToSales(setSales), []);
  React.useEffect(() => subscribeToCreditNotes(setCreditNotes), []);
  React.useEffect(() => subscribeToDebitNotes(setDebitNotes), []);
  React.useEffect(() => subscribeToProductionVouchers(setProductionVouchers), []);

  const stockSummary = computeStockSummary(items, purchases, sales, creditNotes, debitNotes, productionVouchers);
  const stockByItemId = new Map(stockSummary.map((s) => [s.itemId, s]));

  const finishedGoodOptions = items.filter((i) => (i.bom ?? []).length > 0);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      finishedItemId: "",
      date: new Date().toISOString().slice(0, 10),
      quantityProduced: 1,
      additionalCost: 0,
      notes: "",
    },
  });

  const finishedItemId = watch("finishedItemId");
  const quantityProduced = Number(watch("quantityProduced")) || 0;
  const additionalCost = Number(watch("additionalCost")) || 0;
  const finishedItem = items.find((i) => i.id === finishedItemId);

  const consumedLines = (finishedItem?.bom ?? []).map((bomLine) => {
    const rawStock = stockByItemId.get(bomLine.itemId);
    const rate = rawStock?.avgCost ?? 0;
    const quantity = Math.round(bomLine.quantityPerUnit * quantityProduced * 1000) / 1000;
    const value = Math.round(quantity * rate * 100) / 100;
    const available = rawStock?.closingQty ?? 0;
    return { itemId: bomLine.itemId, itemName: bomLine.itemName, quantity, unit: bomLine.unit, rate, value, available };
  });

  const materialCost = Math.round(consumedLines.reduce((s, l) => s + l.value, 0) * 100) / 100;
  const totalCost = Math.round((materialCost + additionalCost) * 100) / 100;
  const unitCost = quantityProduced > 0 ? Math.round((totalCost / quantityProduced) * 100) / 100 : 0;
  const insufficientStock = consumedLines.some((l) => l.quantity > l.available + 0.001);

  const onSubmit = async (values: FormValues) => {
    const item = items.find((i) => i.id === values.finishedItemId);
    if (!item) return;
    try {
      await createProductionVoucher(
        {
          date: values.date,
          finishedItemId: item.id,
          finishedItemName: item.name,
          quantityProduced: values.quantityProduced,
          unit: item.unit,
          consumedLines: consumedLines.map(({ available: _available, ...line }) => line),
          materialCost,
          additionalCost: values.additionalCost,
          totalCost,
          unitCost,
          notes: values.notes ?? "",
        },
        user.uid
      );
      toast.success("Production recorded");
      router.push("/accounts/production");
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  };

  return (
    <div>
      <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
        <Factory className="size-6 text-gold" /> New Production Entry
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Converts raw materials into a finished good — consumes the bill of materials (scaled to quantity
        produced) out of stock and adds the finished good in, valued at material cost plus any labor/overhead.
      </p>

      {finishedGoodOptions.length === 0 && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>No items have a bill of materials yet. Add one from the Items page (edit a finished-good item, e.g. Barbed Wire, and add its raw materials under &quot;Bill of materials&quot;) before recording production.</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <div>
            <Label>Finished good</Label>
            <Controller
              control={control}
              name="finishedItemId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5 w-full"><SelectValue placeholder="Select a finished good" /></SelectTrigger>
                  <SelectContent>
                    {finishedGoodOptions.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.finishedItemId && <p className="mt-1 text-xs text-destructive">{errors.finishedItemId.message}</p>}
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" className="mt-1.5" {...register("date")} />
          </div>
          <div>
            <Label htmlFor="quantityProduced">
              Quantity produced {finishedItem ? `(${UNIT_LABELS[finishedItem.unit]})` : ""}
            </Label>
            <Input id="quantityProduced" type="number" step="0.001" className="mt-1.5" {...register("quantityProduced", { valueAsNumber: true })} />
            {errors.quantityProduced && <p className="mt-1 text-xs text-destructive">{errors.quantityProduced.message}</p>}
          </div>
          <div>
            <Label htmlFor="additionalCost">Additional cost — labor/overhead (₹)</Label>
            <Input id="additionalCost" type="number" step="0.01" className="mt-1.5" {...register("additionalCost", { valueAsNumber: true })} />
          </div>
        </div>

        {finishedItem && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-heading text-base font-semibold text-foreground">Raw materials consumed</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="pb-2 text-left">Material</th>
                    <th className="pb-2 text-right">Qty needed</th>
                    <th className="pb-2 text-right">In stock</th>
                    <th className="pb-2 text-right">Avg cost</th>
                    <th className="pb-2 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {consumedLines.map((l) => (
                    <tr key={l.itemId}>
                      <td className="py-1.5 text-foreground">{l.itemName}</td>
                      <td className={`py-1.5 text-right tabular-nums ${l.quantity > l.available + 0.001 ? "text-destructive font-medium" : "text-foreground"}`}>
                        {num.format(l.quantity)} {UNIT_LABELS[l.unit]}
                      </td>
                      <td className="py-1.5 text-right tabular-nums text-muted-foreground">{num.format(l.available)}</td>
                      <td className="py-1.5 text-right tabular-nums text-muted-foreground">{inr.format(l.rate)}</td>
                      <td className="py-1.5 text-right tabular-nums text-foreground">{inr.format(l.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {insufficientStock && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <p>Not enough stock for one or more raw materials — saving anyway will let stock go negative.</p>
              </div>
            )}

            <div className="mt-4 flex flex-col items-end gap-1 border-t border-border pt-4 text-sm">
              <div className="flex w-full max-w-xs justify-between text-muted-foreground"><span>Material cost</span><span className="tabular-nums text-foreground">{inr.format(materialCost)}</span></div>
              <div className="flex w-full max-w-xs justify-between text-muted-foreground"><span>Additional cost</span><span className="tabular-nums text-foreground">{inr.format(additionalCost)}</span></div>
              <div className="flex w-full max-w-xs justify-between border-t border-border pt-1 font-semibold text-foreground"><span>Total cost</span><span className="tabular-nums">{inr.format(totalCost)}</span></div>
              <div className="flex w-full max-w-xs justify-between font-semibold text-gold"><span>Unit cost</span><span className="tabular-nums">{inr.format(unitCost)}</span></div>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" className="mt-1.5" rows={2} {...register("notes")} />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.push("/accounts/production")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !finishedItem} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Save Production Entry"}
          </Button>
        </div>
      </form>
    </div>
  );
}
