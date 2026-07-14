import type { LedgerAccount, LedgerEntry } from "@/lib/accounts/ledger";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type StatementRow = LedgerEntry & { balance: number };

// Chronological transaction history for one party with a running balance —
// the general ledger keeps entries in insertion order, so this re-sorts by
// date (opening-balance entries use "—" and always come first) and replays
// the running total.
export function buildStatementRows(account: LedgerAccount): StatementRow[] {
  const sorted = [...account.entries].sort((a, b) => {
    if (a.date === "—") return -1;
    if (b.date === "—") return 1;
    return a.date.localeCompare(b.date);
  });

  let balance = 0;
  return sorted.map((entry) => {
    balance = round2(balance + entry.debit - entry.credit);
    return { ...entry, balance };
  });
}
