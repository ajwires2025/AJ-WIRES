import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

// Indian financial year: April (month index 3) through March.
export function currentFinancialYearKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed; 3 = April
  const startYear = month >= 3 ? year : year - 1;
  const endYearShort = ((startYear + 1) % 100).toString().padStart(2, "0");
  return `${startYear}-${endYearShort}`;
}

// Sequential per financial year, no gaps, max 16 chars, format AJW/2026-27/0001.
export async function getNextInvoiceNumber(date: Date = new Date()): Promise<string> {
  return getNextNumber("sales", "AJW", date);
}

// Same sequential-per-FY mechanism, reusable for any document series (credit
// notes, debit notes, ...) — each gets its own counter and prefix.
export async function getNextNumber(series: string, prefix: string, date: Date = new Date()): Promise<string> {
  const fyKey = currentFinancialYearKey(date);
  const counterRef = doc(db, "counters", `${series}-${fyKey}`);

  const nextSeq = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? (snap.data().nextSeq as number) : 1;
    tx.set(counterRef, { nextSeq: current + 1, fyKey }, { merge: true });
    return current;
  });

  return `${prefix}/${fyKey}/${String(nextSeq).padStart(4, "0")}`;
}
