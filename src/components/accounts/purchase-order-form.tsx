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
import { ConfirmDeleteDialog } from "@/components/accounts/confirm-delete-dialog";
import { subscribeToParties } from "@/lib/accounts/parties";
import { subscribeToItems } from "@/lib/accounts/items";
import { calcLine, calcBillTotals } from "@/lib/accounts/gst-calc";
import {
  getNextPoNumber,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  convertPurchaseOrderToPurchase,
} from "@/lib/accounts/purchase-orders";
import { GST_STATES, HOME_STATE_CODE } from "@/lib/accounts/gst-states";
import {
  UNIT_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
  type Party,
  type Item,
  type PurchaseOrder,
  type PurchaseOrderInput,
  type PurchaseOrderStatus,
} from "@/lib/accounts/types";
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

const poSchema = z.object({
  supplierId: z.string().min(1, "Select a supplier"),
  poNumber: z.string().min(1, "Enter or generate a PO number").max(16, "Max 16 characters"),
  poDate: z.string().min(1, "Enter the PO date"),
  expectedDate: z.string().min(1, "Enter an expected delivery date"),
  placeOfSupplyStateCode: z.string().min(1, "Select a state"),
  items: z.array(lineSchema).min(1, "Add at least one item"),
  status: z.enum(["draft", "sent", "confirmed", "cancelled", "converted"]),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof poSchema>;

const emptyLine = {
  itemId: "",
  description: "",
  hsnCode: "",
  unit: "kg" as const,
  quantity: 1,
  rate: 0,
  gstRate: 18,
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function PurchaseOrderForm({ po, user }: { po: PurchaseOrder | null; user: SessionUser }) {
  const router = useRouter();
  const isConverted = po?.status === "converted";

  const [parties, setParties] = React.useState<Party[]>([]);
  const [items, setItems] = React.useState<Item[]>([]);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [generatingNumber, setGeneratingNumber] = React.useState(false);
  const [convertOpen, setConvertOpen] = React.useState(false);
  const [convertBillNumber, setConvertBillNumber] = React.useState("");
  const [converting, setConverting] = React.useState(false);

  React.useEffect(() => subscribeToParties(setParties), []);
  React.useEffect(() => subscribeToItems(setItems), []);

  const suppliers = parties.filter((p) => p.type === "supplier" || p.type === "both");

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(poSchema),
    defaultValues: po
      ? {
          supplierId: po.supplierId,
          poNumber: po.poNumber,
          poDate: po.poDate,
          expectedDate: po.expectedDate,
          placeOfSupplyStateCode: po.placeOfSupplyStateCode,
          items: po.items.map((i) => ({
            itemId: i.itemId,
            description: i.description,
            hsnCode: i.hsnCode,
            unit: i.unit,
            quantity: i.quantity,
            rate: i.rate,
            gstRate: i.gstRate,
          })),
          status: po.status,
          notes: po.notes,
        }
      : {
          supplierId: "",
          poNumber: "",
          poDate: new Date().toISOString().slice(0, 10),
          expectedDate: addDays(new Date().toISOString().slice(0, 10), 7),
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

  const computedLines = watchedItems.map((line) =>
    calcLine(Number(line.quantity) || 0, Number(line.rate) || 0, Number(line.gstRate) || 0, watchedPlaceOfSupply)
  );
  const lineTotals = watchedItems.map((line, i) => ({ ...line, ...computedLines[i] }));
  const totals = calcBillTotals(lineTotals);

  const handleSupplierChange = (supplierId: string) => {
    setValue("supplierId", supplierId);
    const party = parties.find((p) => p.id === supplierId);
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
    setValue(`items.${index}.rate`, item.defaultCostPrice);
  };

  const handleGenerateNumber = async () => {
    setGeneratingNumber(true);
    try {
      const next = await getNextPoNumber();
      setValue("poNumber", next);
    } catch {
      toast.error("Couldn't generate PO number. Try again.");
    } finally {
      setGeneratingNumber(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const supplier = parties.find((p) => p.id === values.supplierId);
      const lines = values.items.map((line, i) => ({ ...line, ...computedLines[i] }));
      const billTotals = calcBillTotals(lines);

      const input: PurchaseOrderInput = {
        supplierId: values.supplierId,
        supplierName: supplier?.name ?? "",
        poNumber: values.poNumber,
        poDate: values.poDate,
        expectedDate: values.expectedDate,
        placeOfSupplyStateCode: values.placeOfSupplyStateCode,
        items: lines,
        taxableValue: billTotals.taxableValue,
        cgst: billTotals.cgst,
        sgst: billTotals.sgst,
        igst: billTotals.igst,
        totalTax: billTotals.totalTax,
        roundOff: billTotals.roundOff,
        grandTotal: billTotals.grandTotal,
        status: values.status,
        convertedPurchaseId: po?.convertedPurchaseId ?? "",
        notes: values.notes ?? "",
      };

      if (!po) {
        await createPurchaseOrder(input, user.uid);
      } else {
        await updatePurchaseOrder(po.id, input);
      }

      toast.success(po ? "Purchase order updated" : "Purchase order saved");
      router.push("/accounts/purchase-orders");
      router.refresh();
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  };

  const handleConvert = async () => {
    if (!po || !convertBillNumber.trim()) return;
    setConverting(true);
    try {
      const purchaseId = await convertPurchaseOrderToPurchase(po, convertBillNumber.trim(), user.uid);
      toast.success("Converted to purchase bill");
      router.push(`/accounts/purchases/${purchaseId}`);
      router.refresh();
    } catch {
      toast.error("Couldn't convert. Try again.");
    } finally {
      setConverting(false);
      setConvertOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!po) return;
    try {
      await deletePurchaseOrder(po.id, user.uid, user.name);
      toast.success("Purchase order deleted");
      router.push("/accounts/purchase-orders");
      router.refresh();
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {isConverted && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          This PO was converted to purchase bill{" "}
          <Link href={`/accounts/purchases/${po.convertedPurchaseId}`} className="underline">
            view bill
          </Link>
          . It&apos;s kept for audit trail — edits here won&apos;t affect the bill already created.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold text-foreground">Purchase order details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Label>Supplier</Label>
            <Controller
              control={control}
              name="supplierId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={handleSupplierChange}>
                  <SelectTrigger className="mt-1.5 w-full"><SelectValue placeholder="Select a supplier" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.supplierId && <p className="mt-1 text-xs text-destructive">{errors.supplierId.message}</p>}
          </div>

          <div>
            <Label htmlFor="poNumber">PO number</Label>
            <div className="mt-1.5 flex gap-1.5">
              <Input id="poNumber" {...register("poNumber")} />
              <Button type="button" size="icon" variant="outline" onClick={handleGenerateNumber} disabled={generatingNumber} title="Generate next number">
                {generatingNumber ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              </Button>
            </div>
            {errors.poNumber && <p className="mt-1 text-xs text-destructive">{errors.poNumber.message}</p>}
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
            <Label htmlFor="poDate">PO date</Label>
            <Input id="poDate" type="date" className="mt-1.5" {...register("poDate")} />
          </div>

          <div>
            <Label htmlFor="expectedDate">Expected delivery</Label>
            <Input id="expectedDate" type="date" className="mt-1.5" {...register("expectedDate")} />
          </div>

          <div>
            <Label>Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => field.onChange(v as PurchaseOrderStatus)} disabled={isConverted}>
                  <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PURCHASE_ORDER_STATUS_LABELS)
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
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
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
                    <Label className="text-xs">Rate (₹)</Label>
                    <Input type="number" step="0.01" className="mt-1" {...register(`items.${index}.rate`, { valueAsNumber: true })} />
                  </div>

                  <div>
                    <Label className="text-xs">GST %</Label>
                    <Input type="number" step="0.01" className="mt-1" {...register(`items.${index}.gstRate`, { valueAsNumber: true })} />
                  </div>

                  <div className="lg:col-span-2">
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
        <h2 className="font-heading text-base font-semibold text-foreground">Tax summary</h2>
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
        <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Taxable value</span><span className="tabular-nums">{inr.format(totals.taxableValue)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total tax</span><span className="tabular-nums">{inr.format(totals.totalTax)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Round off</span><span className="tabular-nums">{inr.format(totals.roundOff)}</span></div>
          <div className="flex justify-between border-t border-border pt-1.5 font-semibold text-foreground"><span>Grand total</span><span className="tabular-nums">{inr.format(totals.grandTotal)}</span></div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" className="mt-1.5" rows={3} {...register("notes")} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/accounts/purchase-orders")}>
          Back to Purchase Orders
        </Button>
        <div className="flex flex-wrap gap-2">
          {po && !isConverted && (
            <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          )}
          {po && watchedStatus === "confirmed" && !isConverted && (
            <Button type="button" variant="outline" onClick={() => setConvertOpen(true)} className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400">
              <ArrowRightCircle className="size-4" /> Convert to Purchase Bill
            </Button>
          )}
          {!isConverted && (
            <Button type="submit" disabled={isSubmitting} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : po ? "Save changes" : "Save purchase order"}
            </Button>
          )}
        </div>
      </div>

      {po && (
        <ConfirmDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title={`Delete purchase order ${po.poNumber}?`}
          description="This can't be undone."
          onConfirm={handleDelete}
        />
      )}

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Purchase Bill</DialogTitle>
            <DialogDescription>Enter the supplier&apos;s actual bill number to create the real purchase record.</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="convertBillNumber">Supplier&apos;s bill number</Label>
            <Input
              id="convertBillNumber"
              className="mt-1.5"
              value={convertBillNumber}
              onChange={(e) => setConvertBillNumber(e.target.value)}
              placeholder="e.g. INV/2026/0452"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button type="button" disabled={!convertBillNumber.trim() || converting} onClick={handleConvert} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
              {converting ? <Loader2 className="size-4 animate-spin" /> : "Convert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
