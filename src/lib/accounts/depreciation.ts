import type { FixedAsset } from "@/lib/accounts/types";
import { financialYearPeriod, type Period } from "@/lib/accounts/period";
import { currentFinancialYearKey } from "@/lib/accounts/invoice-number";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

function fyKeyForDate(date: Date): string {
  return currentFinancialYearKey(date);
}

function nextFyKey(fyKey: string): string {
  const [startYear] = fyKey.split("-").map(Number);
  return `${startYear + 1}-${String((startYear + 2) % 100).padStart(2, "0")}`;
}

// Depreciation charged for ONE financial year, given the asset's book value
// at the start of that FY. WDV follows the standard Income Tax convention:
// half the normal rate if the asset was in use for less than 180 days in
// its year of purchase. SLM depreciates evenly and prorates only in the
// purchase-year by days actually in service.
function depreciationForFy(asset: FixedAsset, fyKey: string, openingValue: number): number {
  const fy = financialYearPeriod(fyKey);
  const purchase = new Date(asset.purchaseDate);
  const isPurchaseFy = fyKeyForDate(purchase) === fyKey;
  const inServiceFrom = isPurchaseFy ? purchase : fy.start;
  const daysInService = daysBetween(inServiceFrom, fy.end) + 1;

  if (asset.depreciationMethod === "wdv") {
    const halfRate = isPurchaseFy && daysInService < 180;
    const rate = asset.depreciationRatePercent / 100 / (halfRate ? 2 : 1);
    return round2(Math.max(0, openingValue) * rate);
  }

  const usefulLife = asset.usefulLifeYears > 0 ? asset.usefulLifeYears : 1;
  const annual = (asset.purchaseCost - asset.salvageValue) / usefulLife;
  const daysInFy = daysBetween(fy.start, fy.end) + 1;
  const charge = isPurchaseFy ? annual * (daysInService / daysInFy) : annual;
  return round2(Math.max(0, Math.min(charge, openingValue - asset.salvageValue)));
}

export type FyDepreciationRow = { fyKey: string; opening: number; depreciation: number; closing: number };

// Full year-by-year schedule from the asset's purchase FY through the FY
// containing `uptoDate` (defaults to today). Stops early if the asset is
// disposed or fully depreciated down to its floor value.
export function computeAssetSchedule(asset: FixedAsset, uptoDate: Date = new Date()): FyDepreciationRow[] {
  const rows: FyDepreciationRow[] = [];
  const floor = asset.depreciationMethod === "slm" ? asset.salvageValue : 0;
  const stopFyKey = fyKeyForDate(uptoDate);
  const disposalFyKey = asset.status === "disposed" && asset.disposalDate ? fyKeyForDate(new Date(asset.disposalDate)) : null;

  let fyKey = fyKeyForDate(new Date(asset.purchaseDate));
  let opening = asset.purchaseCost;

  // Capped so a bad useful-life/rate input can't loop forever.
  for (let i = 0; i < 100; i++) {
    if (disposalFyKey && fyKey === disposalFyKey) {
      rows.push({ fyKey, opening, depreciation: 0, closing: 0 });
      break;
    }
    const dep = opening > floor + 0.01 ? depreciationForFy(asset, fyKey, opening) : 0;
    const closing = round2(Math.max(floor, opening - dep));
    rows.push({ fyKey, opening, depreciation: round2(opening - closing), closing });
    opening = closing;
    if (fyKey === stopFyKey || closing <= floor + 0.01) break;
    fyKey = nextFyKey(fyKey);
  }
  return rows;
}

export function currentBookValue(asset: FixedAsset, asOfDate: Date = new Date()): number {
  if (asset.status === "disposed" && asset.disposalDate && new Date(asset.disposalDate) <= asOfDate) return 0;
  const schedule = computeAssetSchedule(asset, asOfDate);
  return schedule.length ? schedule[schedule.length - 1].closing : asset.purchaseCost;
}

export function netBlock(assets: FixedAsset[], asOfDate: Date = new Date()): number {
  return round2(assets.reduce((sum, a) => sum + currentBookValue(a, asOfDate), 0));
}

export function totalAccumulatedDepreciation(assets: FixedAsset[], asOfDate: Date = new Date()): number {
  return round2(assets.reduce((sum, a) => sum + (a.purchaseCost - currentBookValue(a, asOfDate)), 0));
}

// Depreciation attributable to a reporting Period (a calendar month or a
// full FY, as offered by the P&L/Dashboard period picker), by prorating
// each asset's FY depreciation charge across the days of its FY that
// overlap the period. For a full-FY period this reduces to the FY figure.
export function calcDepreciationForPeriod(assets: FixedAsset[], period: Period): number {
  let total = 0;
  for (const asset of assets) {
    const purchase = new Date(asset.purchaseDate);
    if (purchase > period.end) continue;
    if (asset.status === "disposed" && asset.disposalDate && new Date(asset.disposalDate) < period.start) continue;

    const fyKey = fyKeyForDate(period.start);
    const fy = financialYearPeriod(fyKey);
    const schedule = computeAssetSchedule(asset, period.end);
    const row = schedule.find((r) => r.fyKey === fyKey);
    if (!row || row.depreciation <= 0) continue;

    const overlapStart = period.start > fy.start ? period.start : fy.start;
    const overlapEnd = period.end < fy.end ? period.end : fy.end;
    if (overlapEnd < overlapStart) continue;
    const daysInFy = daysBetween(fy.start, fy.end) + 1;
    const overlapDays = daysBetween(overlapStart, overlapEnd) + 1;
    total += row.depreciation * (overlapDays / daysInFy);
  }
  return round2(total);
}
