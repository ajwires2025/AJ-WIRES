import type { Expense, Sale, TdsChallan, TdsSection } from "@/lib/accounts/types";
import { inPeriod, type Period } from "@/lib/accounts/period";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type TdsBySection = { section: TdsSection | "Other"; amount: number };

export type TdsSummary = {
  // Payable: TDS WE deducted on vendor payments (Expenses), and what we've
  // deposited via challans. Outstanding is cumulative (all-time), like a
  // real liability balance — not scoped to the period picker.
  payableDeductedInPeriod: number;
  payableBySection: TdsBySection[];
  payableDepositedInPeriod: number;
  payableOutstanding: number;
  // Receivable: TDS customers deducted on our sales (a credit to claim
  // against income tax — verify against Form 26AS). FY-to-date is most
  // relevant for return filing, so both period and cumulative are exposed.
  receivableInPeriod: number;
  receivableBySection: TdsBySection[];
  receivableCumulative: number;
};

function groupBySection(rows: { section: TdsSection | ""; amount: number }[]): TdsBySection[] {
  const totals = new Map<string, number>();
  for (const r of rows) {
    if (!r.section || r.amount <= 0) continue;
    totals.set(r.section, round2((totals.get(r.section) ?? 0) + r.amount));
  }
  return Array.from(totals.entries()).map(([section, amount]) => ({ section: section as TdsSection, amount }));
}

export function calcTdsSummary(expenses: Expense[], sales: Sale[], tdsChallans: TdsChallan[], period: Period): TdsSummary {
  const expensesInPeriod = expenses.filter((e) => inPeriod(e.date, period) && e.direction === "expense");
  const payableDeductedInPeriod = round2(expensesInPeriod.reduce((sum, e) => sum + (e.tdsAmount || 0), 0));
  const payableBySection = groupBySection(expensesInPeriod.map((e) => ({ section: e.tdsSection, amount: e.tdsAmount || 0 })));

  const challansInPeriod = tdsChallans.filter((c) => inPeriod(c.date, period));
  const payableDepositedInPeriod = round2(challansInPeriod.reduce((sum, c) => sum + c.amount, 0));

  const totalDeductedAllTime = round2(expenses.filter((e) => e.direction === "expense").reduce((sum, e) => sum + (e.tdsAmount || 0), 0));
  const totalDepositedAllTime = round2(tdsChallans.reduce((sum, c) => sum + c.amount, 0));
  const payableOutstanding = round2(totalDeductedAllTime - totalDepositedAllTime);

  const salesInPeriod = sales.filter((s) => inPeriod(s.invoiceDate, period));
  const receivableInPeriod = round2(salesInPeriod.reduce((sum, s) => sum + (s.tdsAmount || 0), 0));
  const receivableBySection = groupBySection(salesInPeriod.map((s) => ({ section: s.tdsSection, amount: s.tdsAmount || 0 })));
  const receivableCumulative = round2(sales.reduce((sum, s) => sum + (s.tdsAmount || 0), 0));

  return {
    payableDeductedInPeriod,
    payableBySection,
    payableDepositedInPeriod,
    payableOutstanding,
    receivableInPeriod,
    receivableBySection,
    receivableCumulative,
  };
}
