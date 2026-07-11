"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, FileText, Upload, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { calcLine, calcSaleTotals, calcLineMargin, derivePaymentStatus } from "@/lib/accounts/gst-calc";
import { getNextInvoiceNumber } from "@/lib/accounts/invoice-number";
import { GST_STATES, HOME_STATE_CODE } from "@/lib/accounts/gst-states";
import { UNIT_LABELS, PAYMENT_STATUS_LABELS, type Party, type Item, type Sale, type SaleInput } from "@/lib/accounts/types";
import {
  createSale,
  updateSale,
  deleteSale,
  uploadSaleInvoiceFile,
} from "@/lib/accounts/sales";
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

const saleSchema = z.object({
  customerId: z.string().min(1, "Select a customer"),
  invoiceNumber: z.string().min(1, "Enter or generate an invoice number").max(16, "Max 16 characters"),
  invoiceDate: z.string().min(1, "Enter the invoice date"),
  dueDate: z.string().min(1, "Enter a due date"),
  placeOfSupplyStateCode: z.string().min(1, "Select a state"),
  items: z.array(lineSchema).min(1, "Add at least one item"),
  amountReceived: z.number().min(0),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof saleSchema>;

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

export function SaleForm({ sale, user }: { sale: Sale | null; user: SessionUser }) {
  const router = useRouter();
  const isAdmin = user.role === "admin";
  const readOnly = !isAdmin;

  const [parties, setParties] = React.useState<Party[]>([]);
  const [items, setItems] = React.useState<Item[]>([]);
  const [invoiceFile, setInvoiceFile] = React.useState<File | null>(null);
  const [existingFileUrl] = React.useState(sale?.invoiceFileUrl ?? "");
  const [existingFileName] = React.useState(sale?.invoiceFileName ?? "");
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [generatingNumber, setGeneratingNumber] = React.useState(false);

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
    resolver: zodResolver(saleSchema),
    defaultValues: sale
      ? {
          customerId: sale.customerId,
          invoiceNumber: sale.invoiceNumber,
          invoiceDate: sale.invoiceDate,
          dueDate: sale.dueDate,
          placeOfSupplyStateCode: sale.placeOfSupplyStateCode,
          items: sale.items.map((i) => ({
            itemId: i.itemId,
            description: i.description,
            hsnCode: i.hsnCode,
            unit: i.unit,
            quantity: i.quantity,
            rate: i.rate,
            costPrice: i.costPrice,
            gstRate: i.gstRate,
          })),
          amountReceived: sale.amountReceived,
          notes: sale.notes,
        }
      : {
          customerId: "",
          invoiceNumber: "",
          invoiceDate: new Date().toISOString().slice(0, 10),
          dueDate: new Date().toISOString().slice(0, 10),
          placeOfSupplyStateCode: HOME_STATE_CODE,
          items: [emptyLine],
          amountReceived: 0,
          notes: "",
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = watch("items");
  const watchedPlaceOfSupply = watch("placeOfSupplyStateCode");
  const watchedAmountReceived = watch("amountReceived");

  const computedLines = watchedItems.map((line) => {
    const gstCalc = calcLine(Number(line.quantity) || 0, Number(line.rate) || 0, Number(line.gstRate) || 0, watchedPlaceOfSupply);
    const lineMargin = calcLineMargin(Number(line.quantity) || 0, Number(line.rate) || 0, Number(line.costPrice) || 0);
    return { ...gstCalc, lineMargin };
  });
  const saleItemsForTotals = watchedItems.map((line, i) => ({ ...line, ...computedLines[i] }));
  const totals = calcSaleTotals(saleItemsForTotals);
  const paymentStatus = derivePaymentStatus(totals.grandTotal, Number(watchedAmountReceived) || 0);

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

  const handleGenerateInvoiceNumber = async () => {
    setGeneratingNumber(true);
    try {
      const next = await getNextInvoiceNumber();
      setValue("invoiceNumber", next);
    } catch {
      toast.error("Couldn't generate invoice number. Try again.");
    } finally {
      setGeneratingNumber(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const customer = parties.find((p) => p.id === values.customerId);
      const lines = values.items.map((line, i) => ({
        ...line,
        ...computedLines[i],
      }));
      const saleTotals = calcSaleTotals(lines);

      const input: SaleInput = {
        customerId: values.customerId,
        customerName: customer?.name ?? "",
        invoiceNumber: values.invoiceNumber,
        invoiceDate: values.invoiceDate,
        dueDate: values.dueDate,
        placeOfSupplyStateCode: values.placeOfSupplyStateCode,
        items: lines,
        taxableValue: saleTotals.taxableValue,
        cgst: saleTotals.cgst,
        sgst: saleTotals.sgst,
        igst: saleTotals.igst,
        totalTax: saleTotals.totalTax,
        roundOff: saleTotals.roundOff,
        grandTotal: saleTotals.grandTotal,
        amountReceived: values.amountReceived,
        paymentStatus: derivePaymentStatus(saleTotals.grandTotal, values.amountReceived),
        invoiceFileUrl: existingFileUrl,
        invoiceFileName: existingFileName,
        cogsTotal: saleTotals.cogsTotal,
        grossProfit: saleTotals.grossProfit,
        marginPercent: saleTotals.marginPercent,
        notes: values.notes ?? "",
      };

      let saleId = sale?.id;
      if (!saleId) {
        saleId = await createSale(input, user.uid);
      } else {
        await updateSale(saleId, input);
      }

      if (invoiceFile) {
        try {
          const uploaded = await uploadSaleInvoiceFile(saleId, invoiceFile);
          await updateSale(saleId, { ...input, invoiceFileUrl: uploaded.url, invoiceFileName: uploaded.name });
        } catch {
          toast.warning("Invoice saved, but the file couldn't be uploaded (Storage isn't set up yet).");
        }
      }

      toast.success(sale ? "Invoice updated" : "Invoice recorded");
      router.push("/accounts/sales");
      router.refresh();
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  };

  const handleDelete = async () => {
    if (!sale) return;
    try {
      await deleteSale(sale.id);
      toast.success("Invoice deleted");
      router.push("/accounts/sales");
      router.refresh();
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold text-foreground">Invoice details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Label>Customer</Label>
            <Controller
              control={control}
              name="customerId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={handleCustomerChange} disabled={readOnly}>
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
            <Label htmlFor="invoiceNumber">Invoice number</Label>
            <div className="mt-1.5 flex gap-1.5">
              <Input id="invoiceNumber" disabled={readOnly} {...register("invoiceNumber")} />
              {!readOnly && (
                <Button type="button" size="icon" variant="outline" onClick={handleGenerateInvoiceNumber} disabled={generatingNumber} title="Generate next number">
                  {generatingNumber ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                </Button>
              )}
            </div>
            {errors.invoiceNumber && <p className="mt-1 text-xs text-destructive">{errors.invoiceNumber.message}</p>}
          </div>

          <div>
            <Label>Place of supply</Label>
            <Controller
              control={control}
              name="placeOfSupplyStateCode"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
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
            <Label htmlFor="invoiceDate">Invoice date</Label>
            <Input id="invoiceDate" type="date" className="mt-1.5" disabled={readOnly} {...register("invoiceDate")} />
          </div>

          <div>
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" type="date" className="mt-1.5" disabled={readOnly} {...register("dueDate")} />
          </div>

          <div>
            <Label htmlFor="amountReceived">Amount received (₹)</Label>
            <Input
              id="amountReceived"
              type="number"
              step="0.01"
              className="mt-1.5"
              disabled={readOnly}
              {...register("amountReceived", { valueAsNumber: true })}
            />
          </div>

          <div>
            <Label>Payment status</Label>
            <div className="mt-1.5">
              <Badge
                variant="secondary"
                className={
                  paymentStatus === "paid"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : paymentStatus === "partial"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-destructive/10 text-destructive"
                }
              >
                {PAYMENT_STATUS_LABELS[paymentStatus]}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold text-foreground">Line items</h2>
          {!readOnly && (
            <Button type="button" size="sm" variant="outline" onClick={() => append(emptyLine)}>
              <Plus className="size-4" /> Add item
            </Button>
          )}
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
                        <Select value={f.value} onValueChange={(v) => handleItemChange(index, v)} disabled={readOnly}>
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
                    <Input className="mt-1" disabled={readOnly} {...register(`items.${index}.hsnCode`)} />
                  </div>

                  <div>
                    <Label className="text-xs">Unit</Label>
                    <Controller
                      control={control}
                      name={`items.${index}.unit`}
                      render={({ field: f }) => (
                        <Select value={f.value} onValueChange={f.onChange} disabled={readOnly}>
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
                    <Input
                      type="number"
                      step="0.001"
                      className="mt-1"
                      disabled={readOnly}
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Sale rate (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mt-1"
                      disabled={readOnly}
                      {...register(`items.${index}.rate`, { valueAsNumber: true })}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Cost price (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mt-1"
                      disabled={readOnly}
                      {...register(`items.${index}.costPrice`, { valueAsNumber: true })}
                    />
                  </div>

                  <div>
                    <Label className="text-xs">GST %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      className="mt-1"
                      disabled={readOnly}
                      {...register(`items.${index}.gstRate`, { valueAsNumber: true })}
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <Label className="text-xs">Description</Label>
                    <Input className="mt-1" disabled={readOnly} {...register(`items.${index}.description`)} />
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
                  {!readOnly && fields.length > 1 && (
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
        <h2 className="font-heading text-base font-semibold text-foreground">Invoice file & notes</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="invoiceFile">Invoice file (PDF/JPG/PNG, max 10 MB)</Label>
            {!readOnly && (
              <Input
                id="invoiceFile"
                type="file"
                accept="application/pdf,image/jpeg,image/jpg,image/png"
                className="mt-1.5"
                onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
              />
            )}
            {existingFileUrl && (
              <a
                href={existingFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-gold-light hover:underline dark:text-gold"
              >
                <FileText className="size-4" /> View invoice <ExternalLink className="size-3" />
              </a>
            )}
            {invoiceFile && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Upload className="size-4" /> {invoiceFile.name} (will upload on save)
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              File storage isn&apos;t set up yet — the invoice still saves, but the file won&apos;t upload until Storage is enabled.
            </p>
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" className="mt-1.5" rows={3} disabled={readOnly} {...register("notes")} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" onClick={() => router.push("/accounts/sales")}>
          Back to Sales
        </Button>
        <div className="flex gap-2">
          {!readOnly && sale && (
            <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          )}
          {!readOnly && (
            <Button type="submit" disabled={isSubmitting} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : sale ? "Save changes" : "Record invoice"}
            </Button>
          )}
        </div>
      </div>

      {sale && (
        <ConfirmDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={`Delete invoice ${sale.invoiceNumber}?`}
          description="This can't be undone."
          onConfirm={handleDelete}
        />
      )}
    </form>
  );
}
