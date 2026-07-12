import type { Payment } from "@/lib/accounts/types";
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

// Running cash position from every recorded payment to date — not a real bank
// reconciliation, just money in vs money out through this system.
export function calcCashFlow(payments: Payment[], period: Period): CashFlow {
  const before = payments.filter((p) => new Date(p.paymentDate) < period.start);
  const openingCash = round2(
    before.reduce((sum, p) => sum + (p.direction === "received" ? p.amount : -p.amount), 0)
  );

  const inPeriodPayments = payments.filter((p) => inPeriod(p.paymentDate, period));
  const cashIn = round2(
    inPeriodPayments.filter((p) => p.direction === "received").reduce((sum, p) => sum + p.amount, 0)
  );
  const cashOut = round2(
    inPeriodPayments.filter((p) => p.direction === "paid").reduce((sum, p) => sum + p.amount, 0)
  );
  const netCashFlow = round2(cashIn - cashOut);
  const closingCash = round2(openingCash + netCashFlow);

  return { openingCash, cashIn, cashOut, netCashFlow, closingCash };
}
