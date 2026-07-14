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
import { createGstAdjustment, updateGstAdjustment } from "@/lib/accounts/gst-adjustments";
import { GST_ADJUSTMENT_CATEGORIES, type GstAdjustment, type GstAdjustmentInput } from "@/lib/accounts/types";

const schema = z.object({
  date: z.string().min(1, "Enter a date"),
  category: z.enum(GST_ADJUSTMENT_CATEGORIES),
  description: z.string().min(1, "Enter a description"),
  cgst: z.number(),
  sgst: z.number(),
  igst: z.number(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function toInput(values: FormValues): GstAdjustmentInput {
  return { ...values, notes: values.notes ?? "" };
}

const DEFAULT_VALUES: FormValues = {
  date: new Date().toISOString().slice(0, 10),
  category: "Other",
  description: "",
  cgst: 0,
  sgst: 0,
  igst: 0,
  notes: "",
};

export function GstAdjustmentFormDialog({
  open,
  onOpenChange,
  adjustment,
  createdBy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adjustment: GstAdjustment | null;
  createdBy: string;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT_VALUES });

  React.useEffect(() => {
    if (!open) return;
    reset(
      adjustment
        ? {
            date: adjustment.date,
            category: adjustment.category,
            description: adjustment.description,
            cgst: adjustment.cgst,
            sgst: adjustment.sgst,
            igst: adjustment.igst,
            notes: adjustment.notes,
          }
        : DEFAULT_VALUES
    );
  }, [open, adjustment, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      const input = toInput(values);
      if (adjustment) {
        await updateGstAdjustment(adjustment.id, input);
        toast.success("Adjustment updated");
      } else {
        await createGstAdjustment(input, createdBy);
        toast.success("Adjustment recorded");
      }
      onOpenChange(false);
    } catch {
      toast.error("Couldn't save. Try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{adjustment ? "Edit GST Adjustment" : "Add GST Adjustment"}</DialogTitle>
          <DialogDescription>
            Positive amounts increase net GST payable; negative amounts reduce it (add ITC / carry forward).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" className="mt-1.5" {...register("date")} />
              {errors.date && <p className="mt-1 text-xs text-destructive">{errors.date.message}</p>}
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
                      {GST_ADJUSTMENT_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" className="mt-1.5" placeholder="e.g. RCM on GTA freight for June" {...register("description")} />
              {errors.description && <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>}
            </div>

            <div>
              <Label htmlFor="cgst">CGST (₹)</Label>
              <Input id="cgst" type="number" step="0.01" className="mt-1.5" {...register("cgst", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="sgst">SGST (₹)</Label>
              <Input id="sgst" type="number" step="0.01" className="mt-1.5" {...register("sgst", { valueAsNumber: true })} />
            </div>
            <div>
              <Label htmlFor="igst">IGST (₹)</Label>
              <Input id="igst" type="number" step="0.01" className="mt-1.5" {...register("igst", { valueAsNumber: true })} />
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
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : adjustment ? "Save changes" : "Add adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
