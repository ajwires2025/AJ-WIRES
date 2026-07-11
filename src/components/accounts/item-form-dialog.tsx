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
import { ITEM_CATEGORY_LABELS, UNIT_LABELS, type Item, type ItemInput } from "@/lib/accounts/types";
import { createItem, updateItem } from "@/lib/accounts/items";

const itemSchema = z.object({
  name: z.string().min(2, "Enter a name"),
  category: z.enum(["gi_wire", "chain_link", "barbed_wire", "other"]),
  hsnCode: z.string().min(4, "Enter an HSN code"),
  unit: z.enum(["kg", "meter", "roll", "piece"]),
  defaultCostPrice: z.number().min(0),
  defaultSalePrice: z.number().min(0),
  gstRate: z.number().min(0).max(100),
  notes: z.string().optional(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

function toInput(values: ItemFormValues): ItemInput {
  return { ...values, notes: values.notes ?? "" };
}

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  createdBy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  createdBy: string;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      category: "gi_wire",
      hsnCode: "",
      unit: "kg",
      defaultCostPrice: 0,
      defaultSalePrice: 0,
      gstRate: 18,
      notes: "",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    reset(
      item
        ? {
            name: item.name,
            category: item.category,
            hsnCode: item.hsnCode,
            unit: item.unit,
            defaultCostPrice: item.defaultCostPrice,
            defaultSalePrice: item.defaultSalePrice,
            gstRate: item.gstRate,
            notes: item.notes,
          }
        : {
            name: "",
            category: "gi_wire",
            hsnCode: "",
            unit: "kg",
            defaultCostPrice: 0,
            defaultSalePrice: 0,
            gstRate: 18,
            notes: "",
          }
    );
  }, [open, item, reset]);

  const onSubmit = async (values: ItemFormValues) => {
    try {
      const input = toInput(values);
      if (item) {
        await updateItem(item.id, input);
        toast.success("Item updated");
      } else {
        await createItem(input, createdBy);
        toast.success("Item added");
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
          <DialogTitle>{item ? "Edit Item" : "Add Item"}</DialogTitle>
          <DialogDescription>
            HSN and GST rate are editable defaults — verify with your CA before relying on them.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" className="mt-1.5" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div>
              <Label>Category</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(ITEM_CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label>Unit</Label>
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
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
              <Label htmlFor="hsnCode">HSN code</Label>
              <Input id="hsnCode" className="mt-1.5" {...register("hsnCode")} />
              {errors.hsnCode && <p className="mt-1 text-xs text-destructive">{errors.hsnCode.message}</p>}
            </div>

            <div>
              <Label htmlFor="gstRate">GST rate (%)</Label>
              <Input id="gstRate" type="number" step="0.01" className="mt-1.5" {...register("gstRate")} />
            </div>

            <div>
              <Label htmlFor="defaultCostPrice">Default cost price (₹)</Label>
              <Input id="defaultCostPrice" type="number" step="0.01" className="mt-1.5" {...register("defaultCostPrice")} />
            </div>

            <div>
              <Label htmlFor="defaultSalePrice">Default sale price (₹)</Label>
              <Input id="defaultSalePrice" type="number" step="0.01" className="mt-1.5" {...register("defaultSalePrice")} />
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
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : item ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
