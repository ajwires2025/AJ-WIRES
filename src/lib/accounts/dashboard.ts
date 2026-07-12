import type { Purchase, Sale, Payment } from "@/lib/accounts/types";
import { inPeriod, monthPeriod, type Period } from "@/lib/accounts/period";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type DashboardSummary = {
  totalSales: number;
  totalPurchases: number;
  grossProfit: number;
  marginPercent: number;
  outputGst: number;
  inputGst: number;
  netGst: number;
  cashReceived: number;
  cashPaid: number;
  totalReceivables: number;
  totalPayables: number;
};

// Receivables/payables are a running position as of today — not scoped to the
// period picker, since "who owes what right now" isn't a monthly question.
export function calcDashboardSummary(
  sales: Sale[],
  purchases: Purchase[],
  payments: Payment[],
  period: Period
): DashboardSummary {
  const salesInPeriod = sales.filter((s) => inPeriod(s.invoiceDate, period));
  const purchasesInPeriod = purchases.filter((p) => inPeriod(p.billDate, period));
  const paymentsInPeriod = payments.filter((p) => inPeriod(p.paymentDate, period));

  const totalSales = round2(salesInPeriod.reduce((sum, s) => sum + s.taxableValue, 0));
  const totalPurchases = round2(purchasesInPeriod.reduce((sum, p) => sum + p.taxableValue, 0));
  const grossProfit = round2(salesInPeriod.reduce((sum, s) => sum + s.grossProfit, 0));
  const marginPercent = totalSales > 0 ? round2((grossProfit / totalSales) * 100) : 0;

  const outputGst = round2(salesInPeriod.reduce((sum, s) => sum + s.totalTax, 0));
  const inputGst = round2(purchasesInPeriod.reduce((sum, p) => sum + p.totalTax, 0));
  const netGst = round2(outputGst - inputGst);

  const cashReceived = round2(
    paymentsInPeriod.filter((p) => p.direction === "received").reduce((sum, p) => sum + p.amount, 0)
  );
  const cashPaid = round2(
    paymentsInPeriod.filter((p) => p.direction === "paid").reduce((sum, p) => sum + p.amount, 0)
  );

  const totalReceivables = round2(
    sales.filter((s) => s.paymentStatus !== "paid").reduce((sum, s) => sum + (s.grandTotal - s.amountReceived), 0)
  );
  const totalPayables = round2(
    purchases.filter((p) => p.paymentStatus !== "paid").reduce((sum, p) => sum + (p.grandTotal - p.amountPaid), 0)
  );

  return {
    totalSales,
    totalPurchases,
    grossProfit,
    marginPercent,
    outputGst,
    inputGst,
    netGst,
    cashReceived,
    cashPaid,
    totalReceivables,
    totalPayables,
  };
}

export type MonthlyTrendPoint = {
  monthKey: string;
  label: string;
  sales: number;
  purchases: number;
  profit: number;
};

export function buildMonthlyTrend(sales: Sale[], purchases: Purchase[], monthKeys: string[]): MonthlyTrendPoint[] {
  return monthKeys.map((monthKey) => {
    const period = monthPeriod(monthKey);
    const monthSales = sales.filter((s) => inPeriod(s.invoiceDate, period));
    const monthPurchases = purchases.filter((p) => inPeriod(p.billDate, period));
    return {
      monthKey,
      label: period.start.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      sales: round2(monthSales.reduce((sum, s) => sum + s.taxableValue, 0)),
      purchases: round2(monthPurchases.reduce((sum, p) => sum + p.taxableValue, 0)),
      profit: round2(monthSales.reduce((sum, s) => sum + s.grossProfit, 0)),
    };
  });
}

export type TopEntry = { name: string; value: number };

export function topCustomersByValue(sales: Sale[], period: Period, limit = 5): TopEntry[] {
  const totals = new Map<string, number>();
  for (const s of sales.filter((s) => inPeriod(s.invoiceDate, period))) {
    totals.set(s.customerName, round2((totals.get(s.customerName) ?? 0) + s.taxableValue));
  }
  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function topItemsByValue(sales: Sale[], period: Period, limit = 5): TopEntry[] {
  const totals = new Map<string, number>();
  for (const s of sales.filter((s) => inPeriod(s.invoiceDate, period))) {
    for (const item of s.items) {
      totals.set(item.description, round2((totals.get(item.description) ?? 0) + item.taxableValue));
    }
  }
  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}
