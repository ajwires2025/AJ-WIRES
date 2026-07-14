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
import { createEmployee, updateEmployee } from "@/lib/accounts/employees";
import type { Employee, EmployeeInput } from "@/lib/accounts/types";

const schema = z.object({
  name: z.string().min(2, "Enter a name"),
  employeeCode: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  dateOfJoining: z.string().min(1, "Enter the joining date"),
  status: z.enum(["active", "inactive"]),
  panNumber: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  basic: z.number().min(0),
  hra: z.number().min(0),
  conveyance: z.number().min(0),
  specialAllowance: z.number().min(0),
  pfApplicable: z.boolean(),
  pfRatePercent: z.number().min(0).max(100),
  esiApplicable: z.boolean(),
  esiEmployeeRatePercent: z.number().min(0).max(100),
  esiEmployerRatePercent: z.number().min(0).max(100),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  name: "",
  employeeCode: "",
  designation: "",
  department: "",
  dateOfJoining: new Date().toISOString().slice(0, 10),
  status: "active",
  panNumber: "",
  bankAccountNumber: "",
  bankIfsc: "",
  basic: 0,
  hra: 0,
  conveyance: 0,
  specialAllowance: 0,
  pfApplicable: false,
  pfRatePercent: 12,
  esiApplicable: false,
  esiEmployeeRatePercent: 0.75,
  esiEmployerRatePercent: 3.25,
  notes: "",
};

function toInput(values: FormValues): EmployeeInput {
  return {
    name: values.name,
    employeeCode: values.employeeCode ?? "",
    designation: values.designation ?? "",
    department: values.department ?? "",
    dateOfJoining: values.dateOfJoining,
    dateOfLeaving: "",
    status: values.status,
    panNumber: values.panNumber ?? "",
    bankAccountNumber: values.bankAccountNumber ?? "",
    bankIfsc: values.bankIfsc ?? "",
    basic: values.basic,
    hra: values.hra,
    conveyance: values.conveyance,
    specialAllowance: values.specialAllowance,
    pfApplicable: values.pfApplicable,
    pfRatePercent: values.pfApplicable ? values.pfRatePercent : 0,
    esiApplicable: values.esiApplicable,
    esiEmployeeRatePercent: values.esiApplicable ? values.esiEmployeeRatePercent : 0,
    esiEmployerRatePercent: values.esiApplicable ? values.esiEmployerRatePercent : 0,
    notes: values.notes ?? "",
  };
}

export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  createdBy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  createdBy: string;
}) {
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: DEFAULT_VALUES });

  React.useEffect(() => {
    if (!open) return;
    reset(
      employee
        ? {
            name: employee.name,
            employeeCode: employee.employeeCode,
            designation: employee.designation,
            department: employee.department,
            dateOfJoining: employee.dateOfJoining,
            status: employee.status,
            panNumber: employee.panNumber,
            bankAccountNumber: employee.bankAccountNumber,
            bankIfsc: employee.bankIfsc,
            basic: employee.basic,
            hra: employee.hra,
            conveyance: employee.conveyance,
            specialAllowance: employee.specialAllowance,
            pfApplicable: employee.pfApplicable,
            pfRatePercent: employee.pfRatePercent || 12,
            esiApplicable: employee.esiApplicable,
            esiEmployeeRatePercent: employee.esiEmployeeRatePercent || 0.75,
            esiEmployerRatePercent: employee.esiEmployerRatePercent || 3.25,
            notes: employee.notes,
          }
        : DEFAULT_VALUES
    );
  }, [open, employee, reset]);

  const pfApplicable = watch("pfApplicable");
  const esiApplicable = watch("esiApplicable");
  const basic = watch("basic");
  const hra = watch("hra");
  const conveyance = watch("conveyance");
  const specialAllowance = watch("specialAllowance");
  const grossPreview = (Number(basic) || 0) + (Number(hra) || 0) + (Number(conveyance) || 0) + (Number(specialAllowance) || 0);

  const onSubmit = async (values: FormValues) => {
    try {
      const input = toInput(values);
      if (employee) {
        await updateEmployee(employee.id, input);
        toast.success("Employee updated");
      } else {
        await createEmployee(input, createdBy);
        toast.success("Employee added");
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
          <DialogTitle>{employee ? "Edit Employee" : "Add Employee"}</DialogTitle>
          <DialogDescription>PF/ESI applicability and rates are working defaults — verify with your CA.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" className="mt-1.5" {...register("name")} />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="employeeCode">Employee code</Label>
              <Input id="employeeCode" className="mt-1.5" {...register("employeeCode")} />
            </div>

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
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div>
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" className="mt-1.5" {...register("designation")} />
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" className="mt-1.5" {...register("department")} />
            </div>

            <div>
              <Label htmlFor="dateOfJoining">Date of joining</Label>
              <Input id="dateOfJoining" type="date" className="mt-1.5" {...register("dateOfJoining")} />
              {errors.dateOfJoining && <p className="mt-1 text-xs text-destructive">{errors.dateOfJoining.message}</p>}
            </div>

            <div>
              <Label htmlFor="panNumber">PAN</Label>
              <Input id="panNumber" className="mt-1.5" {...register("panNumber")} />
            </div>

            <div>
              <Label htmlFor="bankAccountNumber">Bank account number</Label>
              <Input id="bankAccountNumber" className="mt-1.5" {...register("bankAccountNumber")} />
            </div>

            <div>
              <Label htmlFor="bankIfsc">IFSC</Label>
              <Input id="bankIfsc" className="mt-1.5" {...register("bankIfsc")} />
            </div>
          </div>

          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-semibold text-foreground">Monthly salary structure</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="basic">Basic (₹)</Label>
                <Input id="basic" type="number" step="0.01" className="mt-1.5" {...register("basic", { valueAsNumber: true })} />
              </div>
              <div>
                <Label htmlFor="hra">HRA (₹)</Label>
                <Input id="hra" type="number" step="0.01" className="mt-1.5" {...register("hra", { valueAsNumber: true })} />
              </div>
              <div>
                <Label htmlFor="conveyance">Conveyance (₹)</Label>
                <Input id="conveyance" type="number" step="0.01" className="mt-1.5" {...register("conveyance", { valueAsNumber: true })} />
              </div>
              <div>
                <Label htmlFor="specialAllowance">Special allowance (₹)</Label>
                <Input id="specialAllowance" type="number" step="0.01" className="mt-1.5" {...register("specialAllowance", { valueAsNumber: true })} />
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">Gross: ₹{grossPreview.toLocaleString("en-IN")}/month</p>
          </div>

          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <input id="pfApplicable" type="checkbox" className="size-4 cursor-pointer accent-gold" {...register("pfApplicable")} />
              <Label htmlFor="pfApplicable" className="cursor-pointer">PF applicable</Label>
            </div>
            {pfApplicable && (
              <div className="mt-2">
                <Label htmlFor="pfRatePercent">PF rate (%) — employee &amp; employer each</Label>
                <Input id="pfRatePercent" type="number" step="0.01" className="mt-1.5 max-w-32" {...register("pfRatePercent", { valueAsNumber: true })} />
              </div>
            )}

            <div className="mt-3 flex items-center gap-2">
              <input id="esiApplicable" type="checkbox" className="size-4 cursor-pointer accent-gold" {...register("esiApplicable")} />
              <Label htmlFor="esiApplicable" className="cursor-pointer">ESI applicable</Label>
            </div>
            {esiApplicable && (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="esiEmployeeRatePercent">Employee rate (%)</Label>
                  <Input id="esiEmployeeRatePercent" type="number" step="0.01" className="mt-1.5" {...register("esiEmployeeRatePercent", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="esiEmployerRatePercent">Employer rate (%)</Label>
                  <Input id="esiEmployerRatePercent" type="number" step="0.01" className="mt-1.5" {...register("esiEmployerRatePercent", { valueAsNumber: true })} />
                </div>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" className="mt-1.5" rows={2} {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
              {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : employee ? "Save changes" : "Add employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
