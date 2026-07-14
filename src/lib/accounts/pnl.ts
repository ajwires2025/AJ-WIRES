import type { Sale, Expense, FixedAsset, Payslip } from "@/lib/accounts/types";
import { CAPITAL_EXPENDITURE_CATEGORY } from "@/lib/accounts/types";
import { inPeriod, type Period } from "@/lib/accounts/period";
import { calcDepreciationForPeriod } from "@/lib/accounts/depreciation";

const SALARIES_CATEGORY = "Salaries & Wages";

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
export function calcProfitAndLoss(
  sales: Sale[],
  expenses: Expense[],
  fixedAssets: FixedAsset[] = [],
  payslips: Payslip[] = [],
  period: Period
): ProfitAndLoss {
  const salesInPeriod = sales.filter((s) => inPeriod(s.invoiceDate, period));
  const revenue = round2(salesInPeriod.reduce((sum, s) => sum + s.taxableValue, 0));
  const cogs = round2(salesInPeriod.reduce((sum, s) => sum + s.cogsTotal, 0));
  const grossProfit = round2(revenue - cogs);
  const grossMarginPercent = revenue > 0 ? round2((grossProfit / revenue) * 100) : 0;

  // Capital expenditure is excluded here — it's capitalized as a Fixed Asset
  // rather than expensed immediately; only depreciation (added below) should
  // reduce profit. Cash Flow still counts the outflow.
  const expensesInPeriod = expenses.filter((e) => inPeriod(e.date, period) && e.category !== CAPITAL_EXPENDITURE_CATEGORY);

  const byCategory = (direction: "expense" | "income"): ExpenseByCategory[] => {
    const totals = new Map<string, number>();
    for (const e of expensesInPeriod.filter((e) => e.direction === direction)) {
      totals.set(e.category, round2((totals.get(e.category) ?? 0) + e.taxableValue));
    }
    return Array.from(totals.entries()).map(([category, amount]) => ({ category, amount }));
  };

  const otherIncomeByCategory = byCategory("income");
  const expensesByCategory = byCategory("expense");
  const depreciation = calcDepreciationForPeriod(fixedAssets, period);
  if (depreciation > 0) expensesByCategory.push({ category: "Depreciation", amount: depreciation });

  // Payroll cost (gross + employer PF/ESI, net of other deductions) merges
  // into the same "Salaries & Wages" line as any manually-logged Expense
  // under that category — same real-world GL account either way.
  const payrollCost = round2(
    payslips
      .filter((p) => inPeriod(`${p.month}-01`, period))
      .reduce((sum, p) => sum + p.grossSalary + p.pfEmployer + p.esiEmployer - p.otherDeductions, 0)
  );
  if (payrollCost > 0) {
    const existing = expensesByCategory.find((c) => c.category === SALARIES_CATEGORY);
    if (existing) existing.amount = round2(existing.amount + payrollCost);
    else expensesByCategory.push({ category: SALARIES_CATEGORY, amount: payrollCost });
  }

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
