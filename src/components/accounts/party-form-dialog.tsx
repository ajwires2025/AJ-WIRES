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
import { GST_STATES } from "@/lib/accounts/gst-states";
import type { Party, PartyInput } from "@/lib/accounts/types";
import { createParty, updateParty } from "@/lib/accounts/parties";

const partySchema = z.object({
  name: z.string().min(2, "Enter a name"),
  type: z.enum(["customer", "supplier", "both"]),
  gstin: z.string().optional(),
  stateCode: z.string().min(1, "Select a state"),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.email("Enter a valid email"), z.literal("")]).optional(),
  openingBalance: z.number(),
  notes: z.string().optional(),
});

type PartyFormValues = z.infer<typeof partySchema>;

function toInput(values: PartyFormValues): PartyInput {
  const state = GST_STATES.find((s) => s.code === values.stateCode)?.name ?? "";
  return {
    name: values.name,
    type: values.type,
    gstin: values.gstin ?? "",
    state,
    stateCode: values.stateCode,
    address: values.address ?? "",
    contactPerson: values.contactPerson ?? "",
    phone: values.phone ?? "",
    email: values.email ?? "",
    openingBalance: values.openingBalance,
    notes: values.notes ?? "",
  };
}

export function PartyFormDialog({
  open,
  onOpenChange,
  party,
  createdBy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  party: Party | null;
  createdBy: string;
}) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartyFormValues>({
    resolver: zodResolver(partySchema),
    defaultValues: {
      name: "",
      type: "customer",
      gstin: "",
      stateCode: "36",
      address: "",
      contactPerson: "",
      phone: "",
      email: "",
      openingBalance: 0,
      notes: "",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    reset(
      party
        ? {
            name: party.name,
            type: party.type,
            gstin: party.gstin,
            stateCode: party.stateCode,
            address: party.address,
            contactPerson: party.contactPerson,
            phone: party.phone,
            email: party.email,
            openingBalance: party.openingBalance,
            notes: party.notes,
          }
        : {
            name: "",
            type: "customer",
            gstin: "",
            stateCode: "36",
            address: "",
            contactPerson: "",
            phone: "",
            email: "",
            openingBalance: 0,
            notes: "",
          }
    );
  }, [open, party, reset]);

  const onSubmit = async (values: PartyFormValues) => {
    try {
      const input = toInput(values);
      if (party) {
        await updateParty(party.id, input);
        toast.success("Party updated");
      } else {
        await createParty(input, createdBy);
        toast.success("Party added");
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
          <DialogTitle>{party ? "Edit Party" : "Add Party"}</DialogTitle>
          <DialogDescription>Customers and suppliers both live here.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" className="mt-1.5" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div>
              <Label>Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label>State (place of supply)</Label>
              <Controller
                control={control}
                name="stateCode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GST_STATES.map((s) => (
                        <SelectItem key={s.code} value={s.code}>
                          {s.code} — {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.stateCode && (
                <p className="mt-1 text-xs text-destructive">{errors.stateCode.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="gstin">GSTIN</Label>
              <Input id="gstin" className="mt-1.5" {...register("gstin")} />
            </div>

            <div>
              <Label htmlFor="openingBalance">Opening balance (₹)</Label>
              <Input
                id="openingBalance"
                type="number"
                step="0.01"
                className="mt-1.5"
                {...register("openingBalance")}
              />
            </div>

            <div>
              <Label htmlFor="contactPerson">Contact person</Label>
              <Input id="contactPerson" className="mt-1.5" {...register("contactPerson")} />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" className="mt-1.5" {...register("phone")} />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" className="mt-1.5" {...register("email")} />
              {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" className="mt-1.5" rows={2} {...register("address")} />
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
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : party ? "Save changes" : "Add party"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
