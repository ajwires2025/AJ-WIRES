import { currentFinancialYearKey } from "@/lib/accounts/invoice-number";

export type Period = { label: string; start: Date; end: Date };

// "2026-01" -> a calendar-month period
export function monthPeriod(monthKey: string): Period {
  const [y, m] = monthKey.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);
  const label = start.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return { label, start, end };
}

export function currentMonthKey(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// Last N months as "YYYY-MM" keys, oldest first.
export function lastMonthKeys(n: number, date: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
    keys.push(currentMonthKey(d));
  }
  return keys;
}

// Indian financial year (April-March) as a date range, from a "2026-27" key.
export function financialYearPeriod(fyKey: string = currentFinancialYearKey()): Period {
  const [startYear] = fyKey.split("-").map(Number);
  const start = new Date(startYear, 3, 1);
  const end = new Date(startYear + 1, 2, 31, 23, 59, 59, 999);
  return { label: `FY ${fyKey}`, start, end };
}

export function inPeriod(dateStr: string, period: Period): boolean {
  const d = new Date(dateStr);
  return d >= period.start && d <= period.end;
}
