import type { Sale } from "@/lib/accounts/types";
import { inPeriod, type Period } from "@/lib/accounts/period";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type ProfitAndLoss = {
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  netProfit: number;
};

// GST (CGST/SGST/IGST) is deliberately excluded — it's a pass-through
// liability/asset, not revenue or expense. There's no separate operating-
// expense (rent, salaries, utilities) module yet, so net profit equals gross
// profit for now; add an expense voucher type before treating this as final.
export function calcProfitAndLoss(sales: Sale[], period: Period): ProfitAndLoss {
  const salesInPeriod = sales.filter((s) => inPeriod(s.invoiceDate, period));
  const revenue = round2(salesInPeriod.reduce((sum, s) => sum + s.taxableValue, 0));
  const cogs = round2(salesInPeriod.reduce((sum, s) => sum + s.cogsTotal, 0));
  const grossProfit = round2(revenue - cogs);
  const grossMarginPercent = revenue > 0 ? round2((grossProfit / revenue) * 100) : 0;

  return { revenue, cogs, grossProfit, grossMarginPercent, netProfit: grossProfit };
}
