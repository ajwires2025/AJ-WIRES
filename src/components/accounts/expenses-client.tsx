"use client";

import * as React from "react";
import { Plus, Search, Receipt, Trash2, Pencil, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseFormDialog } from "@/components/accounts/expense-form-dialog";
import { ConfirmDeleteDialog } from "@/components/accounts/confirm-delete-dialog";
import { subscribeToExpenses, deleteExpense } from "@/lib/accounts/expenses";
import { PAYMENT_METHOD_LABELS, type Expense, type ExpenseDirection } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function ExpensesClient({ user }: { user: SessionUser }) {
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [directionFilter, setDirectionFilter] = React.useState<"all" | ExpenseDirection>("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = React.useState<Expense | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeToExpenses((data) => {
      setExpenses(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = expenses.filter((e) => {
    const matchesDirection = directionFilter === "all" || e.direction === directionFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      e.category.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.partyName.toLowerCase().includes(q);
    return matchesDirection && matchesSearch;
  });

  const totalExpense = filtered.filter((e) => e.direction === "expense").reduce((s, e) => s + e.grandTotal, 0);
  const totalIncome = filtered.filter((e) => e.direction === "income").reduce((s, e) => s + e.grandTotal, 0);

  const handleDelete = async (expense: Expense) => {
    try {
      await deleteExpense(expense.id);
      toast.success("Deleted");
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <Receipt className="size-6 text-gold" /> Expenses &amp; Other Income
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Expenses: {inr.format(totalExpense)} · Other income: {inr.format(totalIncome)}
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingExpense(null);
            setFormOpen(true);
          }}
          className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy"
        >
          <Plus className="size-4" /> Record Entry
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by category, description, or party..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={directionFilter} onValueChange={(v) => setDirectionFilter(v as "all" | ExpenseDirection)}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entries</SelectItem>
            <SelectItem value="expense">Expenses</SelectItem>
            <SelectItem value="income">Other Income</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Card layout below sm */}
      <div className="mt-6 space-y-2 sm:hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No entries yet.</p>
        ) : (
          filtered.map((e) => (
            <div key={e.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{e.category}</p>
                  <p className="truncate text-sm text-muted-foreground">{e.description || e.partyName || e.date}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={`shrink-0 gap-1 ${e.direction === "income" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}
                >
                  {e.direction === "income" ? <ArrowDownCircle className="size-3.5" /> : <ArrowUpCircle className="size-3.5" />}
                  {e.direction === "income" ? "Income" : "Expense"}
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{e.date} · {PAYMENT_METHOD_LABELS[e.method]}</p>
                <p className="font-heading text-base font-bold text-foreground">{inr.format(e.grandTotal)}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditingExpense(e);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeletingExpense(e)}
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-xl border border-border sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Method</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No entries yet.</td></tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className={`gap-1 ${e.direction === "income" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}
                      >
                        {e.direction === "income" ? <ArrowDownCircle className="size-3.5" /> : <ArrowUpCircle className="size-3.5" />}
                        {e.direction === "income" ? "Income" : "Expense"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{e.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.description || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{e.date}</td>
                    <td className="px-4 py-3 text-muted-foreground">{PAYMENT_METHOD_LABELS[e.method]}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(e.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingExpense(e);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletingExpense(e)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editingExpense}
        createdBy={user.uid}
      />
      <ConfirmDeleteDialog
        open={!!deletingExpense}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
        title={`Delete this ${deletingExpense?.direction === "income" ? "income" : "expense"} entry?`}
        description="This can't be undone."
        onConfirm={() => handleDelete(deletingExpense!)}
      />
    </div>
  );
}
