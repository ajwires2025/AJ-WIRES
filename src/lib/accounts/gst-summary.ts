import type { Sale, Purchase, CreditNote, DebitNote, Expense, GstAdjustment } from "@/lib/accounts/types";
import { inPeriod, type Period } from "@/lib/accounts/period";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type GstTaxSplit = { taxableValue: number; cgst: number; sgst: number; igst: number; total: number };

export type GstSummary = {
  // Table 3.1 style — outward supplies (sales), net of credit notes issued.
  outwardTaxable: GstTaxSplit;
  // Table 4 style — ITC available (purchases + GST-applicable expenses), net of debit notes issued.
  inwardTaxable: GstTaxSplit;
  // Manual adjustments for this period (reverse charge, ITC reversal, TDS/TCS, rounding, etc).
  adjustmentsInPeriod: GstAdjustment[];
  adjCgst: number;
  adjSgst: number;
  adjIgst: number;
  // Net position before adjustments — for reference/audit.
  autoNetCgst: number;
  autoNetSgst: number;
  autoNetIgst: number;
  autoNetPayable: number;
  // Net position after adjustments: positive = tax payable in cash, negative = ITC carried forward / refund due.
  netCgst: number;
  netSgst: number;
  netIgst: number;
  netPayable: number;
};

function emptySplit(): GstTaxSplit {
  return { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
}

function addInto(split: GstTaxSplit, taxableValue: number, cgst: number, sgst: number, igst: number) {
  split.taxableValue = round2(split.taxableValue + taxableValue);
  split.cgst = round2(split.cgst + cgst);
  split.sgst = round2(split.sgst + sgst);
  split.igst = round2(split.igst + igst);
  split.total = round2(split.taxableValue + split.cgst + split.sgst + split.igst);
}

function subtractFrom(split: GstTaxSplit, taxableValue: number, cgst: number, sgst: number, igst: number) {
  addInto(split, -taxableValue, -cgst, -sgst, -igst);
}

export function calcGstSummary(
  sales: Sale[],
  purchases: Purchase[],
  creditNotes: CreditNote[],
  debitNotes: DebitNote[],
  expenses: Expense[],
  adjustments: GstAdjustment[],
  period: Period
): GstSummary {
  const outwardTaxable = emptySplit();
  for (const s of sales.filter((s) => inPeriod(s.invoiceDate, period))) {
    addInto(outwardTaxable, s.taxableValue, s.cgst, s.sgst, s.igst);
  }
  for (const cn of creditNotes.filter((c) => inPeriod(c.noteDate, period))) {
    subtractFrom(outwardTaxable, cn.taxableValue, cn.cgst, cn.sgst, cn.igst);
  }

  const inwardTaxable = emptySplit();
  for (const p of purchases.filter((p) => inPeriod(p.billDate, period))) {
    addInto(inwardTaxable, p.taxableValue, p.cgst, p.sgst, p.igst);
  }
  for (const dn of debitNotes.filter((d) => inPeriod(d.noteDate, period))) {
    subtractFrom(inwardTaxable, dn.taxableValue, dn.cgst, dn.sgst, dn.igst);
  }
  for (const e of expenses.filter((e) => e.gstApplicable && inPeriod(e.date, period))) {
    addInto(inwardTaxable, e.taxableValue, e.cgst, e.sgst, e.igst);
  }

  const autoNetCgst = round2(outwardTaxable.cgst - inwardTaxable.cgst);
  const autoNetSgst = round2(outwardTaxable.sgst - inwardTaxable.sgst);
  const autoNetIgst = round2(outwardTaxable.igst - inwardTaxable.igst);
  const autoNetPayable = round2(autoNetCgst + autoNetSgst + autoNetIgst);

  const adjustmentsInPeriod = adjustments.filter((a) => inPeriod(a.date, period));
  const adjCgst = round2(adjustmentsInPeriod.reduce((sum, a) => sum + a.cgst, 0));
  const adjSgst = round2(adjustmentsInPeriod.reduce((sum, a) => sum + a.sgst, 0));
  const adjIgst = round2(adjustmentsInPeriod.reduce((sum, a) => sum + a.igst, 0));

  const netCgst = round2(autoNetCgst + adjCgst);
  const netSgst = round2(autoNetSgst + adjSgst);
  const netIgst = round2(autoNetIgst + adjIgst);
  const netPayable = round2(netCgst + netSgst + netIgst);

  return {
    outwardTaxable,
    inwardTaxable,
    adjustmentsInPeriod,
    adjCgst,
    adjSgst,
    adjIgst,
    autoNetCgst,
    autoNetSgst,
    autoNetIgst,
    autoNetPayable,
    netCgst,
    netSgst,
    netIgst,
    netPayable,
  };
}
