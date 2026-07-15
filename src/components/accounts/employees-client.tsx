"use client";

import * as React from "react";
import { Plus, Search, Users, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmployeeFormDialog } from "@/components/accounts/employee-form-dialog";
import { ConfirmDeleteDialog } from "@/components/accounts/confirm-delete-dialog";
import { subscribeToEmployees, deleteEmployee } from "@/lib/accounts/employees";
import type { Employee } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function EmployeesClient({ user }: { user: SessionUser }) {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = React.useState<Employee | null>(null);

  const canEdit = user.role === "admin" || user.role === "ca";

  React.useEffect(() => {
    const unsubscribe = subscribeToEmployees((data) => {
      setEmployees(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = employees.filter((e) => {
    const q = search.trim().toLowerCase();
    return !q || e.name.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q);
  });

  const totalMonthlyGross = filtered
    .filter((e) => e.status === "active")
    .reduce((sum, e) => sum + e.basic + e.hra + e.conveyance + e.specialAllowance, 0);

  const handleDelete = async (employee: Employee) => {
    try {
      await deleteEmployee(employee.id, user.uid, user.name);
      toast.success("Employee deleted");
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <Users className="size-6 text-gold" /> Employees
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Active monthly gross payroll: {inr.format(totalMonthlyGross)}
          </p>
        </div>
        {canEdit && (
          <Button
            onClick={() => { setEditingEmployee(null); setFormOpen(true); }}
            className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy"
          >
            <Plus className="size-4" /> Add Employee
          </Button>
        )}
      </div>

      <div className="mt-6 relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, code, or designation..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Designation</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-right">Monthly Gross</th>
                <th className="px-4 py-3 text-left">Status</th>
                {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No employees yet.</td></tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{e.name}{e.employeeCode ? ` (${e.employeeCode})` : ""}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.designation}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.dateOfJoining}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(e.basic + e.hra + e.conveyance + e.specialAllowance)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={e.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}>
                        {e.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => { setEditingEmployee(e); setFormOpen(true); }}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setDeletingEmployee(e)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canEdit && (
        <>
          <EmployeeFormDialog open={formOpen} onOpenChange={setFormOpen} employee={editingEmployee} createdBy={user.uid} />
          <ConfirmDeleteDialog
            open={!!deletingEmployee}
            onOpenChange={(open) => !open && setDeletingEmployee(null)}
            title={`Delete ${deletingEmployee?.name}?`}
            description="This removes them from the register. Past payslips already generated for them are kept."
            onConfirm={() => handleDelete(deletingEmployee!)}
          />
        </>
      )}
    </div>
  );
}
