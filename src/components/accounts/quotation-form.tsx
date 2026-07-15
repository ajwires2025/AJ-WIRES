"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, Sparkles, ArrowRightCircle } from "lucide-react";
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
import { ConfirmDeleteDialog } from "@/components/accounts/confirm-delete-dialog";
import { subscribeToParties } from "@/lib/accounts/parties";
import { subscribeToItems } from "@/lib/accounts/items";
import { calcLine, calcSaleTotals, calcLineMargin } from "@/lib/accounts/gst-calc";
import {
  getNextQuoteNumber,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  convertQuotationToSale,
} from "@/lib/accounts/quotations";
import { GST_STATES, HOME_STATE_CODE } from "@/lib/accounts/gst-states";
import {
  UNIT_LABELS,
  QUOTATION_STATUS_LABELS,
  type Party,
  type Item,
  type Quotation,
  type QuotationInput,
  type QuotationStatus,
} from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const lineSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  description: z.string().min(1, "Enter a description"),
  hsnCode: z.string(),
  unit: z.enum(["kg", "meter", "roll", "piece"]),
  quantity: z.number().min(0.001, "Enter a quantity"),
  rate: z.number().min(0),
  costPrice: z.number().min(0),
  gstRate: z.number().min(0).max(100),
});

const quotationSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  quoteNumber: z.string().min(1, "Enter or generate a quote number").max(16, "Max 16 characters"),
  quoteDate: z.string().min(1, "Enter the quote date"),
  validUntil: z.string().min(1, "Enter a valid-until date"),
  placeOfSupplyStateCode: z.string().min(1, "Select a state"),
  items: z.array(lineSchema).min(1, "Add at least one item"),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired", "converted"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof quotationSchema>;

const emptyLine = {
  itemId: "",
  description: "",
  hsnCode: "",
  unit: "kg" as const,
  quantity: 1,
  rate: 0,
  costPrice: 0,
  gstRate: 18,
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function QuotationForm({ quotation, user }: { quotation: Quotation | null; user: SessionUser }) {
  const router = useRouter();
  const isConverted = quotation?.status === "converted";

  const [parties, setParties] = React.useState<Party[]>([]);
  const [items, setItems] = React.useState<Item[]>([]);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [generatingNumber, setGeneratingNumber] = React.useState(false);
  const [converting, setConverting] = React.useState(false);

  React.useEffect(() => subscribeToParties(setParties), []);
  React.useEffect(() => subscribeToItems(setItems), []);

  const customers = parties.filter((p) => p.type === "customer" || p.type === "both");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: quotation
      ? {
          customerId: quotation.customerId,
          quoteNumber: quotation.quoteNumber,
          quoteDate: quotation.quoteDate,
          validUntil: quotation.validUntil,
          placeOfSupplyStateCode: quotation.placeOfSupplyStateCode,
          items: quotation.items.map((i) => ({
            itemId: i.itemId,
            description: i.description,
            hsnCode: i.hsnCode,
            unit: i.unit,
            quantity: i.quantity,
            rate: i.rate,
            costPrice: i.costPrice,
            gstRate: i.gstRate,
          })),
          status: quotation.status,
          notes: quotation.notes,
        }
      : {
          customerId: "",
          quoteNumber: "",
          quoteDate: new Date().toISOString().slice(0, 10),
          validUntil: addDays(new Date().toISOString().slice(0, 10), 15),
          placeOfSupplyStateCode: HOME_STATE_CODE,
          items: [emptyLine],
          status: "draft",
          notes: "",
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const watchedPlaceOfSupply = watch("placeOfSupplyStateCode");
  const watchedStatus = watch("status");

  const computedLines = watchedItems.map((line) => {
    const gstCalc = calcLine(Number(line.quantity) || 0, Number(line.rate) || 0, Number(line.gstRate) || 0, watchedPlaceOfSupply);
    const lineMargin = calcLineMargin(Number(line.quantity) || 0, Number(line.rate) || 0, Number(line.costPrice) || 0);
    return { ...gstCalc, lineMargin };
  });
  const lineTotals = watchedItems.map((line, i) => ({ ...line, ...computedLines[i] }));
  const totals = calcSaleTotals(lineTotals);

  const handleCustomerChange = (customerId: string) => {
    setValue("customerId", customerId);
    const party = parties.find((p) => p.id === customerId);
    if (party) setValue("placeOfSupplyStateCode", party.stateCode);
  };

  const handleItemChange = (index: number, itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setValue(`items.${index}.itemId`, item.id);
    setValue(`items.${index}.description`, item.name);
    setValue(`items.${index}.hsnCode`, item.hsnCode);
    setValue(`items.${index}.unit`, item.unit);
    setValue(`items.${index}.gstRate`, item.gstRate);
    setValue(`items.${index}.rate`, item.defaultSalePrice);
    setValue(`items.${index}.costPrice`, item.defaultCostPrice);
  };

  const handleGenerateNumber = async () => {
    setGeneratingNumber(true);
    try {
      const next = await getNextQuoteNumber();
      setValue("quoteNumber", next);
    } catch {
      toast.error("Couldn't generate quote number. Try again.");
    } finally {
      setGeneratingNumber(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const customer = parties.find((p) => p.id === values.customerId);
      const lines = values.items.map((line, i) => ({ ...line, ...computedLines[i] }));
      const saleTotals = calcSaleTotals(lines);

      const input: QuotationInput = {
        customerId: values.customerId,
        customerName: customer?.name ?? "",
        quoteNumber: values.quoteNumber,
        quoteDate: values.quoteDate,
        validUntil: values.validUntil,
        placeOfSupplyStateCode: values.placeOfSupplyStateCode,
        items: lines,
        taxableValue: saleTotals.taxableValue,
        cgst: saleTotals.cgst,
        sgst: saleTotals.sgst,
        igst: saleTotals.igst,
        totalTax: saleTotals.totalTax,
        roundOff: saleTotals.roundOff,
        grandTotal: saleTotals.grandTotal,
        status: values.status,
        convertedSaleId: quotation?.convertedSaleId ?? "",
        notes: values.notes ?? "",
      };

      if (!quotation) {
        await createQuotation(input, user.uid);
      } else {
        await updateQuotation(quotation.id, input);
      }

      toast.success(quotation ? "Quotation updated" : "Quotation saved");
      router.push("/accounts/quotations");
      router.refresh();
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  };

  const handleConvert = async () => {
    if (!quotation) return;
    setConverting(true);
    try {
      const saleId = await convertQuotationToSale(quotation, user.uid);
      toast.success("Converted to invoice");
      router.push(`/accounts/sales/${saleId}`);
      router.refresh();
    } catch {
      toast.error("Couldn't convert. Try again.");
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!quotation) return;
    try {
      await deleteQuotation(quotation.id, user.uid, user.name);
      toast.success("Quotation deleted");
      router.push("/accounts/quotations");
      router.refresh();
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {isConverted && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          This quotation was converted to invoice{" "}
          <Link href={`/accounts/sales/${quotation.convertedSaleId}`} className="underline">
            view invoice
          </Link>
          . It&apos;s kept for audit trail — edits here won&apos;t affect the invoice already created.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold text-foreground">Quotation details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Label>Customer</Label>
            <Controller
              control={control}
              name="customerId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={handleCustomerChange}>
                  <SelectTrigger className="mt-1.5 w-full"><SelectValue placeholder="Select a customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.customerId && <p className="mt-1 text-xs text-destructive">{errors.customerId.message}</p>}
          </div>

          <div>
            <Label htmlFor="quoteNumber">Quote number</Label>
            <div className="mt-1.5 flex gap-1.5">
              <Input id="quoteNumber" {...register("quoteNumber")} />
              <Button type="button" size="icon" variant="outline" onClick={handleGenerateNumber} disabled={generatingNumber} title="Generate next number">
                {generatingNumber ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              </Button>
            </div>
            {errors.quoteNumber && <p className="mt-1 text-xs text-destructive">{errors.quoteNumber.message}</p>}
          </div>

          <div>
            <Label>Place of supply</Label>
            <Controller
              control={control}
              name="placeOfSupplyStateCode"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GST_STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>{s.code} — {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div>
            <Label htmlFor="quoteDate">Quote date</Label>
            <Input id="quoteDate" type="date" className="mt-1.5" {...register("quoteDate")} />
          </div>

          <div>
            <Label htmlFor="validUntil">Valid until</Label>
            <Input id="validUntil" type="date" className="mt-1.5" {...register("validUntil")} />
          </div>

          <div>
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v as QuotationStatus)} disabled={isConverted}>
                  <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(QUOTATION_STATUS_LABELS)
                      .filter(([value]) => value !== "converted")
                      .map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-foreground">Line items</h2>
          <Button type="button" size="sm" variant="outline" onClick={() => append(emptyLine)}>
            <Plus className="size-4" /> Add item
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {fields.map((field, index) => {
            const line = computedLines[index];
            return (
              <div key={field.id} className="rounded-lg border border-border p-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                  <div className="lg:col-span-2">
                    <Label className="text-xs">Item</Label>
                    <Controller
                      control={control}
                      name={`items.${index}.itemId`}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={(v) => handleItemChange(index, v)}>
                          <SelectTrigger className="mt-1 w-full"><SelectValue placeholder="Select an item" /></SelectTrigger>
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
                    <Label className="text-xs">HSN</Label>
                    <Input className="mt-1" {...register(`items.${index}.hsnCode`)} />
                  </div>

                  <div>
                    <Label className="text-xs">Unit</Label>
                    <Controller
                      control={control}
                      name={`items.${index}.unit`}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange}>
                          <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(UNIT_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Quantity</Label>
                    <Input type="number" step="0.001" className="mt-1" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                  </div>

                  <div>
                    <Label className="text-xs">Sale rate (₹)</Label>
                    <Input type="number" step="0.01" className="mt-1" {...register(`items.${index}.rate`, { valueAsNumber: true })} />
                  </div>

                  <div>
                    <Label className="text-xs">Cost price (₹)</Label>
                    <Input type="number" step="0.01" className="mt-1" {...register(`items.${index}.costPrice`, { valueAsNumber: true })} />
                  </div>

                  <div>
                    <Label className="text-xs">GST %</Label>
                    <Input type="number" step="0.01" className="mt-1" {...register(`items.${index}.gstRate`, { valueAsNumber: true })} />
                  </div>

                  <div className="lg:col-span-3">
                    <Label className="text-xs">Description</Label>
                    <Input className="mt-1" {...register(`items.${index}.description`)} />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
                  <div className="flex flex-wrap gap-4 text-muted-foreground">
                    <span>Taxable: <span className="font-medium text-foreground">{inr.format(line?.taxableValue ?? 0)}</span></span>
                    <span>CGST: <span className="font-medium text-foreground">{inr.format(line?.cgst ?? 0)}</span></span>
                    <span>SGST: <span className="font-medium text-foreground">{inr.format(line?.sgst ?? 0)}</span></span>
                    <span>IGST: <span className="font-medium text-foreground">{inr.format(line?.igst ?? 0)}</span></span>
                    <span>Total: <span className="font-medium text-foreground">{inr.format(line?.lineTotal ?? 0)}</span></span>
                    <span>Margin: <span className="font-medium text-gold-light dark:text-gold">{inr.format(line?.lineMargin ?? 0)}</span></span>
                  </div>
                  {fields.length > 1 && (
                    <Button type="button" size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => remove(index)}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {errors.items?.message && <p className="mt-2 text-xs text-destructive">{errors.items.message}</p>}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold text-foreground">Tax & profit summary</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-1.5 text-left">GST Rate</th>
                <th className="py-1.5 text-right">Taxable Value</th>
                <th className="py-1.5 text-right">CGST</th>
                <th className="py-1.5 text-right">SGST</th>
                <th className="py-1.5 text-right">IGST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {totals.taxByRate.map((t) => (
                <tr key={t.gstRate}>
                  <td className="py-1.5">{t.gstRate}%</td>
                  <td className="py-1.5 text-right tabular-nums">{inr.format(t.taxableValue)}</td>
                  <td className="py-1.5 text-right tabular-nums">{inr.format(t.cgst)}</td>
                  <td className="py-1.5 text-right tabular-nums">{inr.format(t.sgst)}</td>
                  <td className="py-1.5 text-right tabular-nums">{inr.format(t.igst)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:justify-end">
          <div className="space-y-1.5 text-sm sm:max-w-xs sm:min-w-64">
            <div className="flex justify-between"><span className="text-muted-foreground">Taxable value</span><span className="tabular-nums">{inr.format(totals.taxableValue)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total tax</span><span className="tabular-nums">{inr.format(totals.totalTax)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Round off</span><span className="tabular-nums">{inr.format(totals.roundOff)}</span></div>
            <div className="flex justify-between border-t border-border pt-1.5 font-semibold text-foreground"><span>Grand total</span><span className="tabular-nums">{inr.format(totals.grandTotal)}</span></div>
          </div>
          <div className="space-y-1.5 rounded-lg bg-gold/10 p-3 text-sm sm:max-w-xs sm:min-w-64">
            <div className="flex justify-between"><span className="text-muted-foreground">Cost of goods sold</span><span className="tabular-nums">{inr.format(totals.cogsTotal)}</span></div>
            <div className="flex justify-between font-semibold text-gold-light dark:text-gold"><span>Gross profit</span><span className="tabular-nums">{inr.format(totals.grossProfit)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Margin</span><span className="tabular-nums">{totals.marginPercent.toFixed(1)}%</span></div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" className="mt-1.5" rows={3} {...register("notes")} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/accounts/quotations")}>
          Back to Quotations
        </Button>
        <div className="flex flex-wrap gap-2">
          {quotation && !isConverted && (
            <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          )}
          {quotation && watchedStatus === "accepted" && !isConverted && (
            <Button type="button" variant="outline" onClick={handleConvert} disabled={converting} className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
              {converting ? <Loader2 className="size-4 animate-spin" /> : <ArrowRightCircle className="size-4" />} Convert to Invoice
            </Button>
          )}
          {!isConverted && (
            <Button type="submit" disabled={isSubmitting} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : quotation ? "Save changes" : "Save quotation"}
            </Button>
          )}
        </div>
      </div>

      {quotation && (
        <ConfirmDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={`Delete quotation ${quotation.quoteNumber}?`}
          description="This can't be undone."
          onConfirm={handleDelete}
        />
      )}
    </form>
  );
}
