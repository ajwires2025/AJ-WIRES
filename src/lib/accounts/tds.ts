function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// TDS is computed on the taxable value (never on GST) per Income Tax rules.
export function calcTdsAmount(taxableValue: number, ratePercent: number): number {
  return round2((taxableValue * ratePercent) / 100);
}

// What actually leaves the bank/cash after withholding TDS from a vendor
// payment — the TDS portion becomes a liability (TDS Payable) instead.
export function calcNetCashPaid(grandTotal: number, tdsAmount: number): number {
  return round2(grandTotal - tdsAmount);
}
