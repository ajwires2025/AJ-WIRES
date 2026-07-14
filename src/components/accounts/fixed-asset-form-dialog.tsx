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
import { createFixedAsset, updateFixedAsset } from "@/lib/accounts/fixed-assets";
import {
  ASSET_CATEGORIES,
  DEFAULT_DEPRECIATION_RATES,
  DEPRECIATION_METHOD_LABELS,
  PAYMENT_METHOD_LABELS,
  type FixedAsset,
  type FixedAssetInput,
  type AssetCategory,
  type DepreciationMethod,
  type PaymentMethod,
} from "@/lib/accounts/types";

const schema = z.object({
  assetName: z.string().min(2, "Enter a name"),
  category: z.enum(ASSET_CATEGORIES),
  purchaseDate: z.string().min(1, "Enter the purchase date"),
  purchaseCost: z.number().min(0.01, "Enter the cost"),
  vendorName: z.string().optional(),
  depreciationMethod: z.enum(["wdv", "slm"]),
  depreciationRatePercent: z.number().min(0).max(100),
  usefulLifeYears: z.number().min(0),
  salvageValue: z.number().min(0),
  status: z.enum(["active", "disposed"]),
  disposalDate: z.string().optional(),
  disposalValue: z.number().min(0),
  notes: z.string().optional(),
  recordCashPayment: z.boolean(),
  paymentMethod: z.enum(["bank", "cash", "upi", "cheque"]),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  assetName: "",
  category: "Plant & Machinery",
  purchaseDate: new Date().toISOString().slice(0, 10),
  purchaseCost: 0,
  vendorName: "",
  depreciationMethod: "wdv",
  depreciationRatePercent: DEFAULT_DEPRECIATION_RATES["Plant & Machinery"],
  usefulLifeYears: 5,
  salvageValue: 0,
  status: "active",
  disposalDate: "",
  disposalValue: 0,
  notes: "",
  recordCashPayment: true,
  paymentMethod: "bank",
};

export function FixedAssetFormDialog({
  open,
  onOpenChange,
  asset,
  createdBy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: FixedAsset | null;
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
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT_VALUES });

  React.useEffect(() => {
    if (!open) return;
    reset(
      asset
        ? {
            assetName: asset.assetName,
            category: asset.category,
            purchaseDate: asset.purchaseDate,
            purchaseCost: asset.purchaseCost,
            vendorName: asset.vendorName,
            depreciationMethod: asset.depreciationMethod,
            depreciationRatePercent: asset.depreciationRatePercent,
            usefulLifeYears: asset.usefulLifeYears,
            salvageValue: asset.salvageValue,
            status: asset.status,
            disposalDate: asset.disposalDate,
            disposalValue: asset.disposalValue,
            notes: asset.notes,
            recordCashPayment: false,
            paymentMethod: "bank",
          }
        : DEFAULT_VALUES
    );
  }, [open, asset, reset]);

  const method = watch("depreciationMethod");
  const status = watch("status");
  const recordCashPayment = watch("recordCashPayment");

  const handleCategoryChange = (category: AssetCategory) => {
    setValue("category", category);
    setValue("depreciationRatePercent", DEFAULT_DEPRECIATION_RATES[category]);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const input: FixedAssetInput = {
        assetName: values.assetName,
        category: values.category,
        purchaseDate: values.purchaseDate,
        purchaseCost: values.purchaseCost,
        vendorName: values.vendorName ?? "",
        depreciationMethod: values.depreciationMethod,
        depreciationRatePercent: values.depreciationRatePercent,
        usefulLifeYears: values.usefulLifeYears,
        salvageValue: values.salvageValue,
        status: values.status,
        disposalDate: values.status === "disposed" ? values.disposalDate ?? "" : "",
        disposalValue: values.status === "disposed" ? values.disposalValue : 0,
        linkedExpenseId: asset?.linkedExpenseId ?? "",
        notes: values.notes ?? "",
      };

      if (asset) {
        await updateFixedAsset(asset.id, input);
        toast.success("Asset updated");
      } else {
        await createFixedAsset(
          input,
          createdBy,
          values.recordCashPayment ? { method: values.paymentMethod } : undefined
        );
        toast.success(values.recordCashPayment ? "Asset added and payment recorded" : "Asset added");
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
          <DialogTitle>{asset ? "Edit Fixed Asset" : "Add Fixed Asset"}</DialogTitle>
          <DialogDescription>
            Depreciation rates are working defaults (Income Tax Act WDV block rates) — verify with your CA.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="assetName">Asset name</Label>
              <Input id="assetName" className="mt-1.5" {...register("assetName")} />
              {errors.assetName && <p className="mt-1 text-xs text-destructive">{errors.assetName.message}</p>}
            </div>

            <div>
              <Label>Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => handleCategoryChange(v as AssetCategory)}>
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ASSET_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label htmlFor="vendorName">Vendor</Label>
              <Input id="vendorName" className="mt-1.5" {...register("vendorName")} />
            </div>

            <div>
              <Label htmlFor="purchaseDate">Purchase date</Label>
              <Input id="purchaseDate" type="date" className="mt-1.5" {...register("purchaseDate")} />
              {errors.purchaseDate && <p className="mt-1 text-xs text-destructive">{errors.purchaseDate.message}</p>}
            </div>

            <div>
              <Label htmlFor="purchaseCost">Purchase cost (₹)</Label>
              <Input id="purchaseCost" type="number" step="0.01" className="mt-1.5" {...register("purchaseCost", { valueAsNumber: true })} />
              {errors.purchaseCost && <p className="mt-1 text-xs text-destructive">{errors.purchaseCost.message}</p>}
            </div>

            <div>
              <Label>Depreciation method</Label>
              <Controller
                control={control}
                name="depreciationMethod"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v as DepreciationMethod)}>
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DEPRECIATION_METHOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {method === "wdv" ? (
              <div>
                <Label htmlFor="depreciationRatePercent">WDV rate (%)</Label>
                <Input id="depreciationRatePercent" type="number" step="0.01" className="mt-1.5" {...register("depreciationRatePercent", { valueAsNumber: true })} />
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="usefulLifeYears">Useful life (years)</Label>
                  <Input id="usefulLifeYears" type="number" step="1" className="mt-1.5" {...register("usefulLifeYears", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="salvageValue">Salvage value (₹)</Label>
                  <Input id="salvageValue" type="number" step="0.01" className="mt-1.5" {...register("salvageValue", { valueAsNumber: true })} />
                </div>
              </>
            )}

            <div>
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="disposed">Disposed / Sold</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {status === "disposed" && (
              <>
                <div>
                  <Label htmlFor="disposalDate">Disposal date</Label>
                  <Input id="disposalDate" type="date" className="mt-1.5" {...register("disposalDate")} />
                </div>
                <div>
                  <Label htmlFor="disposalValue">Disposal value (₹)</Label>
                  <Input id="disposalValue" type="number" step="0.01" className="mt-1.5" {...register("disposalValue", { valueAsNumber: true })} />
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" className="mt-1.5" rows={2} {...register("notes")} />
            </div>
          </div>

          {!asset && (
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-center gap-2">
                <input id="recordCashPayment" type="checkbox" className="size-4 cursor-pointer accent-gold" {...register("recordCashPayment")} />
                <Label htmlFor="recordCashPayment" className="cursor-pointer">Also record the cash payment as an expense</Label>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Books it under &quot;Capital Expenditure (Fixed Asset)&quot; — money out in Cash Flow, but excluded from
                P&amp;L (only depreciation reduces profit).
              </p>
              {recordCashPayment && (
                <div className="mt-3">
                  <Label>Payment method</Label>
                  <Controller
                    control={control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={(v) => field.onChange(v as PaymentMethod)}>
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
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : asset ? "Save changes" : "Add asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
