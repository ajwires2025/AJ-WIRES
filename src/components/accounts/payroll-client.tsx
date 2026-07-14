"use client";

import * as React from "react";
import { Wallet, Sparkles, Loader2, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PayslipFormDialog } from "@/components/accounts/payslip-form-dialog";
import { PaySalaryDialog } from "@/components/accounts/pay-salary-dialog";
import { StatutoryPaymentFormDialog } from "@/components/accounts/statutory-payment-form-dialog";
import { ConfirmDeleteDialog } from "@/components/accounts/confirm-delete-dialog";
import { subscribeToEmployees } from "@/lib/accounts/employees";
import { subscribeToPayslips, deletePayslip, generatePayrollForMonth } from "@/lib/accounts/payslips";
import { subscribeToStatutoryPayments, deleteStatutoryPayment } from "@/lib/accounts/statutory-payments";
import { currentMonthKey, lastMonthKeys, monthPeriod } from "@/lib/accounts/period";
import { PAYMENT_STATUS_LABELS, STATUTORY_PAYMENT_TYPE_LABELS, type Employee, type Payslip, type StatutoryPayment } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

const STATUS_BADGE = {
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  partial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  unpaid: "bg-destructive/10 text-destructive",
} as const;

export function PayrollClient({ user }: { user: SessionUser }) {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [payslips, setPayslips] = React.useState<Payslip[]>([]);
  const [statutoryPayments, setStatutoryPayments] = React.useState<StatutoryPayment[]>([]);
  const [monthKey, setMonthKey] = React.useState(currentMonthKey());
  const [generating, setGenerating] = React.useState(false);
  const [editingPayslip, setEditingPayslip] = React.useState<Payslip | null>(null);
  const [payingPayslip, setPayingPayslip] = React.useState<Payslip | null>(null);
  const [deletingPayslip, setDeletingPayslip] = React.useState<Payslip | null>(null);
  const [statutoryFormOpen, setStatutoryFormOpen] = React.useState(false);
  const [editingStatutory, setEditingStatutory] = React.useState<StatutoryPayment | null>(null);
  const [deletingStatutory, setDeletingStatutory] = React.useState<StatutoryPayment | null>(null);

  const canEdit = user.role === "admin" || user.role === "ca";

  React.useEffect(() => subscribeToEmployees(setEmployees), []);
  React.useEffect(() => subscribeToPayslips(setPayslips), []);
  React.useEffect(() => subscribeToStatutoryPayments(setStatutoryPayments), []);

  const monthOptions = lastMonthKeys(12).map((key) => ({ key, label: monthPeriod(key).label }));
  const payslipsThisMonth = payslips.filter((p) => p.month === monthKey);

  const totalGross = payslipsThisMonth.reduce((sum, p) => sum + p.grossSalary, 0);
  const totalEmployerCost = payslipsThisMonth.reduce((sum, p) => sum + p.grossSalary + p.pfEmployer + p.esiEmployer, 0);
  const totalNet = payslipsThisMonth.reduce((sum, p) => sum + p.netSalary, 0);
  const totalOutstanding = payslipsThisMonth.reduce((sum, p) => sum + (p.netSalary - p.amountPaid), 0);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const count = await generatePayrollForMonth(employees, monthKey, user.uid);
      toast.success(count > 0 ? `Generated ${count} payslip(s)` : "All active employees already have a payslip for this month");
    } catch {
      toast.error("Couldn't generate payroll. Try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeletePayslip = async (payslip: Payslip) => {
    try {
      await deletePayslip(payslip.id);
      toast.success("Payslip deleted");
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  const handleDeleteStatutory = async (payment: StatutoryPayment) => {
    try {
      await deleteStatutoryPayment(payment.id);
      toast.success("Payment deleted");
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <Wallet className="size-6 text-gold" /> Payroll
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{monthPeriod(monthKey).label}</p>
        </div>
        <div className="flex gap-2">
          <Select value={monthKey} onValueChange={setMonthKey}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canEdit && (
            <Button onClick={handleGenerate} disabled={generating} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
              {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Generate Payroll
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
        <p>
          PF/ESI/Professional Tax rates and TDS-on-salary are working defaults or manual entries — verify
          applicability, thresholds, and slab-based TDS with your CA before filing.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gross Payroll</p>
          <p className="mt-1 font-heading text-lg font-bold text-foreground">{inr.format(totalGross)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employer Cost</p>
          <p className="mt-1 font-heading text-lg font-bold text-foreground">{inr.format(totalEmployerCost)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Payable</p>
          <p className="mt-1 font-heading text-lg font-bold text-foreground">{inr.format(totalNet)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</p>
          <p className="mt-1 font-heading text-lg font-bold text-foreground">{inr.format(totalOutstanding)}</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Employee</th>
                <th className="px-4 py-3 text-right">Gross</th>
                <th className="px-4 py-3 text-right">PF</th>
                <th className="px-4 py-3 text-right">ESI</th>
                <th className="px-4 py-3 text-right">PT</th>
                <th className="px-4 py-3 text-right">TDS</th>
                <th className="px-4 py-3 text-right">Net</th>
                <th className="px-4 py-3 text-left">Status</th>
                {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payslipsThisMonth.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="px-4 py-10 text-center text-muted-foreground">
                    No payslips for this month yet. Click &quot;Generate Payroll&quot; to create them from the Employees register.
                  </td>
                </tr>
              ) : (
                payslipsThisMonth.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{p.employeeName}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{inr.format(p.grossSalary)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{inr.format(p.pfEmployee)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{inr.format(p.esiEmployee)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{inr.format(p.professionalTax)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{inr.format(p.tdsSalary)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">{inr.format(p.netSalary)}</td>
                    <td className="px-4 py-3">
                      <button type="button" disabled={!canEdit} onClick={() => canEdit && setPayingPayslip(p)}>
                        <Badge variant="secondary" className={`${STATUS_BADGE[p.paymentStatus]} ${canEdit ? "cursor-pointer hover:opacity-80" : ""}`}>
                          {PAYMENT_STATUS_LABELS[p.paymentStatus]}
                        </Badge>
                      </button>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="icon-sm" variant="ghost" onClick={() => setEditingPayslip(p)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setDeletingPayslip(p)}>
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

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">Statutory Payments</h2>
            <p className="text-sm text-muted-foreground">PF, ESI, and Professional Tax deposits — reduce the corresponding payable liability.</p>
          </div>
          {canEdit && (
            <Button size="sm" onClick={() => { setEditingStatutory(null); setStatutoryFormOpen(true); }} className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
              <Plus className="size-4" /> Record Payment
            </Button>
          )}
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Period</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {statutoryPayments.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-muted-foreground">No statutory payments recorded yet.</td>
                  </tr>
                ) : (
                  statutoryPayments.map((sp) => (
                    <tr key={sp.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{sp.date}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{STATUTORY_PAYMENT_TYPE_LABELS[sp.type]}</Badge></td>
                      <td className="px-4 py-3 text-muted-foreground">{sp.period}</td>
                      <td className="px-4 py-3 text-muted-foreground">{sp.referenceNumber}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(sp.amount)}</td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button size="icon-sm" variant="ghost" onClick={() => { setEditingStatutory(sp); setStatutoryFormOpen(true); }}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setDeletingStatutory(sp)}>
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
      </div>

      {canEdit && (
        <>
          <PayslipFormDialog open={!!editingPayslip} onOpenChange={(open) => !open && setEditingPayslip(null)} payslip={editingPayslip} />
          <PaySalaryDialog open={!!payingPayslip} onOpenChange={(open) => !open && setPayingPayslip(null)} payslip={payingPayslip} user={user} />
          <ConfirmDeleteDialog
            open={!!deletingPayslip}
            onOpenChange={(open) => !open && setDeletingPayslip(null)}
            title={`Delete this payslip for ${deletingPayslip?.employeeName}?`}
            description="This can't be undone. Any payments already recorded against it stay in the Payments log but become unlinked."
            onConfirm={() => handleDeletePayslip(deletingPayslip!)}
          />
          <StatutoryPaymentFormDialog open={statutoryFormOpen} onOpenChange={setStatutoryFormOpen} payment={editingStatutory} createdBy={user.uid} />
          <ConfirmDeleteDialog
            open={!!deletingStatutory}
            onOpenChange={(open) => !open && setDeletingStatutory(null)}
            title="Delete this statutory payment?"
            description="This can't be undone. It will be removed from the payable deposit history."
            onConfirm={() => handleDeleteStatutory(deletingStatutory!)}
          />
        </>
      )}
    </div>
  );
}
