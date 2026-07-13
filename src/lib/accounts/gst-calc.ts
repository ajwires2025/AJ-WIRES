import { isIntraState } from "@/lib/accounts/gst-states";
import type { BillItemLine } from "@/lib/accounts/types";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Same-state (Telangana) -> CGST+SGST split; different state -> IGST at full
// rate. Never combine CGST/SGST into one figure — GST returns need them split.
export function calcLine(
  quantity: number,
  rate: number,
  gstRate: number,
  placeOfSupplyStateCode: string
): Pick<BillItemLine, "taxableValue" | "cgst" | "sgst" | "igst" | "lineTotal"> {
  const taxableValue = round2(quantity * rate);
  const intraState = isIntraState(placeOfSupplyStateCode);

  const cgst = intraState ? round2((taxableValue * gstRate) / 2 / 100) : 0;
  const sgst = intraState ? round2((taxableValue * gstRate) / 2 / 100) : 0;
  const igst = intraState ? 0 : round2((taxableValue * gstRate) / 100);

  return {
    taxableValue,
    cgst,
    sgst,
    igst,
    lineTotal: round2(taxableValue + cgst + sgst + igst),
  };
}

export type TaxByRate = {
  gstRate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
};

export type BillTotals = {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  roundOff: number;
  grandTotal: number;
  taxByRate: TaxByRate[];
};

// GST rules require showing tax broken out per rate when a bill mixes rates
// (e.g. some lines at 18%, some at 12%) — never just one blended total.
export function calcBillTotals(items: BillItemLine[]): BillTotals {
  const taxableValue = round2(items.reduce((sum, i) => sum + i.taxableValue, 0));
  const cgst = round2(items.reduce((sum, i) => sum + i.cgst, 0));
  const sgst = round2(items.reduce((sum, i) => sum + i.sgst, 0));
  const igst = round2(items.reduce((sum, i) => sum + i.igst, 0));
  const totalTax = round2(cgst + sgst + igst);
  const rawGrandTotal = taxableValue + totalTax;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = round2(grandTotal - rawGrandTotal);

  const byRate = new Map<number, TaxByRate>();
  for (const item of items) {
    const existing = byRate.get(item.gstRate) ?? {
      gstRate: item.gstRate,
      taxableValue: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
    };
    existing.taxableValue = round2(existing.taxableValue + item.taxableValue);
    existing.cgst = round2(existing.cgst + item.cgst);
    existing.sgst = round2(existing.sgst + item.sgst);
    existing.igst = round2(existing.igst + item.igst);
    byRate.set(item.gstRate, existing);
  }

  return {
    taxableValue,
    cgst,
    sgst,
    igst,
    totalTax,
    roundOff,
    grandTotal,
    taxByRate: Array.from(byRate.values()).sort((a, b) => a.gstRate - b.gstRate),
  };
}

export function derivePaymentStatus(grandTotal: number, amountPaid: number): "unpaid" | "partial" | "paid" {
  if (amountPaid <= 0) return "unpaid";
  if (amountPaid >= grandTotal) return "paid";
  return "partial";
}

export type ExpenseTax = {
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
};

// Day-to-day expenses/income are almost always with local (intra-state)
// vendors, so this always splits CGST+SGST rather than asking for a formal
// place of supply the way bills do.
export function calcExpenseTax(amount: number, gstRate: number, gstApplicable: boolean): ExpenseTax {
  const taxableValue = round2(amount);
  if (!gstApplicable) {
    return { taxableValue, cgst: 0, sgst: 0, igst: 0, totalTax: 0, grandTotal: taxableValue };
  }
  const cgst = round2((taxableValue * gstRate) / 2 / 100);
  const sgst = round2((taxableValue * gstRate) / 2 / 100);
  const totalTax = round2(cgst + sgst);
  return { taxableValue, cgst, sgst, igst: 0, totalTax, grandTotal: round2(taxableValue + totalTax) };
}

export function calcLineMargin(quantity: number, rate: number, costPrice: number): number {
  return round2((rate - costPrice) * quantity);
}

export type SaleTotals = BillTotals & {
  cogsTotal: number;
  grossProfit: number;
  marginPercent: number;
};

export function calcSaleTotals(
  items: (BillItemLine & { costPrice: number; lineMargin: number })[]
): SaleTotals {
  const billTotals = calcBillTotals(items);
  const cogsTotal = round2(items.reduce((sum, i) => sum + i.costPrice * i.quantity, 0));
  const grossProfit = round2(billTotals.taxableValue - cogsTotal);
  const marginPercent = billTotals.taxableValue > 0 ? round2((grossProfit / billTotals.taxableValue) * 100) : 0;

  return { ...billTotals, cogsTotal, grossProfit, marginPercent };
}
