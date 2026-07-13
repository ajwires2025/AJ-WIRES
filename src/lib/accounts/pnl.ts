import type { Sale, Expense } from "@/lib/accounts/types";
import { inPeriod, type Period } from "@/lib/accounts/period";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type ExpenseByCategory = { category: string; amount: number };

export type ProfitAndLoss = {
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  otherIncome: number;
  otherIncomeByCategory: ExpenseByCategory[];
  totalExpenses: number;
  expensesByCategory: ExpenseByCategory[];
  netProfit: number;
};

// GST (CGST/SGST/IGST) is deliberately excluded — it's a pass-through
// liability/asset, not revenue or expense.
export function calcProfitAndLoss(sales: Sale[], expenses: Expense[], period: Period): ProfitAndLoss {
  const salesInPeriod = sales.filter((s) => inPeriod(s.invoiceDate, period));
  const revenue = round2(salesInPeriod.reduce((sum, s) => sum + s.taxableValue, 0));
  const cogs = round2(salesInPeriod.reduce((sum, s) => sum + s.cogsTotal, 0));
  const grossProfit = round2(revenue - cogs);
  const grossMarginPercent = revenue > 0 ? round2((grossProfit / revenue) * 100) : 0;

  const expensesInPeriod = expenses.filter((e) => inPeriod(e.date, period));

  const byCategory = (direction: "expense" | "income"): ExpenseByCategory[] => {
    const totals = new Map<string, number>();
    for (const e of expensesInPeriod.filter((e) => e.direction === direction)) {
      totals.set(e.category, round2((totals.get(e.category) ?? 0) + e.taxableValue));
    }
    return Array.from(totals.entries()).map(([category, amount]) => ({ category, amount }));
  };

  const otherIncomeByCategory = byCategory("income");
  const expensesByCategory = byCategory("expense");
  const otherIncome = round2(otherIncomeByCategory.reduce((s, c) => s + c.amount, 0));
  const totalExpenses = round2(expensesByCategory.reduce((s, c) => s + c.amount, 0));
  const netProfit = round2(grossProfit + otherIncome - totalExpenses);

  return {
    revenue,
    cogs,
    grossProfit,
    grossMarginPercent,
    otherIncome,
    otherIncomeByCategory,
    totalExpenses,
    expensesByCategory,
    netProfit,
  };
}
