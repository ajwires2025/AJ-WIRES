import type { Payment, Expense, TdsChallan } from "@/lib/accounts/types";
import { inPeriod, type Period } from "@/lib/accounts/period";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type CashFlow = {
  openingCash: number;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
  closingCash: number;
};

// Running cash position from every recorded payment (+ day-to-day
// expense/income entries, which are always immediate cash/bank movements) to
// date — not a real bank reconciliation, just money in vs money out through
// this system.
export function calcCashFlow(payments: Payment[], expenses: Expense[], tdsChallans: TdsChallan[] = [], period: Period): CashFlow {
  // Expenses with TDS withheld only move netCashPaid through cash/bank — the
  // TDS portion doesn't leave until a TdsChallan deposits it.
  const cashImpact = (e: Expense) =>
    e.direction === "income" ? e.grandTotal : round2(e.grandTotal - (e.tdsAmount || 0));

  const challansBefore = tdsChallans.filter((c) => new Date(c.date) < period.start);
  const paymentsBefore = payments.filter((p) => new Date(p.paymentDate) < period.start);
  const expensesBefore = expenses.filter((e) => new Date(e.date) < period.start);
  const openingCash = round2(
    paymentsBefore.reduce((sum, p) => sum + (p.direction === "received" ? p.amount : -p.amount), 0) +
      expensesBefore.reduce((sum, e) => sum + (e.direction === "income" ? cashImpact(e) : -cashImpact(e)), 0) -
      challansBefore.reduce((sum, c) => sum + c.amount, 0)
  );

  const inPeriodPayments = payments.filter((p) => inPeriod(p.paymentDate, period));
  const inPeriodExpenses = expenses.filter((e) => inPeriod(e.date, period));
  const inPeriodChallans = tdsChallans.filter((c) => inPeriod(c.date, period));
  const cashIn = round2(
    inPeriodPayments.filter((p) => p.direction === "received").reduce((sum, p) => sum + p.amount, 0) +
      inPeriodExpenses.filter((e) => e.direction === "income").reduce((sum, e) => sum + cashImpact(e), 0)
  );
  // Depositing withheld TDS with the government (a TdsChallan) is real cash
  // out — it just happens after the original expense, not at the same time.
  const cashOut = round2(
    inPeriodPayments.filter((p) => p.direction === "paid").reduce((sum, p) => sum + p.amount, 0) +
      inPeriodExpenses.filter((e) => e.direction === "expense").reduce((sum, e) => sum + cashImpact(e), 0) +
      inPeriodChallans.reduce((sum, c) => sum + c.amount, 0)
  );
  const netCashFlow = round2(cashIn - cashOut);
  const closingCash = round2(openingCash + netCashFlow);

  return { openingCash, cashIn, cashOut, netCashFlow, closingCash };
}
