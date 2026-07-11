import type { AgingBucket } from "@/lib/accounts/types";

export function daysOverdue(dueDate: string, asOf: Date = new Date()): number {
  const due = new Date(dueDate);
  const diffMs = asOf.setHours(0, 0, 0, 0) - due.setHours(0, 0, 0, 0);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function agingBucket(days: number): AgingBucket {
  if (days <= 30) return "0-30";
  if (days <= 60) return "31-60";
  if (days <= 90) return "61-90";
  return "90+";
}
