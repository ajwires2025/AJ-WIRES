"use client";

import * as React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import { subscribeToItems } from "@/lib/accounts/items";
import { ITEM_CATEGORY_LABELS, UNIT_LABELS, type Item, type ItemInput } from "@/lib/accounts/types";
import { createItem, updateItem } from "@/lib/accounts/items";

const bomLineSchema = z.object({
  itemId: z.string().min(1, "Select a raw material"),
  itemName: z.string(),
  quantityPerUnit: z.number().min(0.001, "Enter a quantity"),
  unit: z.enum(["kg", "meter", "roll", "piece"]),
});

const itemSchema = z.object({
  name: z.string().min(2, "Enter a name"),
  category: z.enum(["gi_wire", "chain_link", "barbed_wire", "other"]),
  hsnCode: z.string().min(4, "Enter an HSN code"),
  unit: z.enum(["kg", "meter", "roll", "piece"]),
  defaultCostPrice: z.number().min(0),
  defaultSalePrice: z.number().min(0),
  gstRate: z.number().min(0).max(100),
  openingStock: z.number().min(0),
  bom: z.array(bomLineSchema),
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
  const [allItems, setAllItems] = React.useState<Item[]>([]);
  React.useEffect(() => subscribeToItems(setAllItems), []);
  const rawMaterialOptions = allItems.filter((i) => i.id !== item?.id);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
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
      openingStock: 0,
      bom: [],
      notes: "",
    },
  });

  const { fields: bomFields, append: appendBom, remove: removeBom } = useFieldArray({ control, name: "bom" });

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
            openingStock: item.openingStock ?? 0,
            bom: item.bom ?? [],
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
            openingStock: 0,
            bom: [],
            notes: "",
          }
    );
  }, [open, item, reset]);

  const handleRawMaterialChange = (index: number, itemId: string) => {
    const raw = allItems.find((i) => i.id === itemId);
    if (!raw) return;
    setValue(`bom.${index}.itemId`, raw.id);
    setValue(`bom.${index}.itemName`, raw.name);
    setValue(`bom.${index}.unit`, raw.unit);
  };

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
              <Input id="gstRate" type="number" step="0.01" className="mt-1.5" {...register("gstRate", { valueAsNumber: true })} />
            </div>

            <div>
              <Label htmlFor="defaultCostPrice">Default cost price (₹)</Label>
              <Input id="defaultCostPrice" type="number" step="0.01" className="mt-1.5" {...register("defaultCostPrice", { valueAsNumber: true })} />
            </div>

            <div>
              <Label htmlFor="defaultSalePrice">Default sale price (₹)</Label>
              <Input id="defaultSalePrice" type="number" step="0.01" className="mt-1.5" {...register("defaultSalePrice", { valueAsNumber: true })} />
            </div>

            <div>
              <Label htmlFor="openingStock">Opening stock (qty)</Label>
              <Input id="openingStock" type="number" step="0.001" className="mt-1.5" {...register("openingStock", { valueAsNumber: true })} />
              {errors.openingStock && <p className="mt-1 text-xs text-destructive">{errors.openingStock.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" className="mt-1.5" rows={2} {...register("notes")} />
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Bill of materials</Label>
                <p className="text-xs text-muted-foreground">
                  Raw materials consumed to produce ONE {UNIT_LABELS[watch("unit")]} of this item. Leave empty for
                  raw materials that aren&apos;t manufactured from anything else.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => appendBom({ itemId: "", itemName: "", quantityPerUnit: 1, unit: "kg" })}
              >
                <Plus className="size-4" /> Add
              </Button>
            </div>

            {bomFields.length > 0 && (
              <div className="mt-3 space-y-2">
                {bomFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-[1.6fr_1fr_auto] gap-2">
                    <Select
                      value={watch(`bom.${index}.itemId`)}
                      onValueChange={(v) => handleRawMaterialChange(index, v)}
                    >
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select raw material" /></SelectTrigger>
                      <SelectContent>
                        {rawMaterialOptions.map((i) => (
                          <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.001"
                      placeholder="Qty per unit"
                      {...register(`bom.${index}.quantityPerUnit`, { valueAsNumber: true })}
                    />
                    <Button type="button" size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => removeBom(index)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
