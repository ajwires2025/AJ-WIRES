"use client";

import * as React from "react";
import { TrendingUp, TrendingDown, Download, Mail, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { subscribeToSales } from "@/lib/accounts/sales";
import { subscribeToPurchases } from "@/lib/accounts/purchases";
import { subscribeToParties } from "@/lib/accounts/parties";
import { subscribeToCreditNotes, creditNotedTotal } from "@/lib/accounts/credit-notes";
import { subscribeToDebitNotes, debitNotedTotal } from "@/lib/accounts/debit-notes";
import { daysOverdue, agingBucket } from "@/lib/accounts/aging";
import { downloadCsv } from "@/lib/accounts/csv";
import { SendReminderDialog } from "@/components/accounts/send-reminder-dialog";
import { PaymentStatusDialog } from "@/components/accounts/payment-status-dialog";
import type { Sale, Purchase, Party, AgingBucket, AgingRow, CreditNote, DebitNote } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const BUCKETS: AgingBucket[] = ["0-30", "31-60", "61-90", "90+"];

const BUCKET_BADGE: Record<AgingBucket, string> = {
  "0-30": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "31-60": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "61-90": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  "90+": "bg-destructive/10 text-destructive",
};

function AgingTable({
  title,
  icon,
  rows,
  onSendReminder,
  onUpdateStatus,
}: {
  title: string;
  icon: React.ReactNode;
  rows: AgingRow[];
  onSendReminder?: (row: AgingRow) => void;
  onUpdateStatus?: (row: AgingRow) => void;
}) {
  const hasActions = !!onSendReminder || !!onUpdateStatus;
  const bucketTotals = BUCKETS.reduce<Record<AgingBucket, number>>((acc, b) => {
    acc[b] = rows.filter((r) => r.bucket === b).reduce((s, r) => s + r.outstanding, 0);
    return acc;
  }, { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 });
  const total = rows.reduce((s, r) => s + r.outstanding, 0);

  const handleExport = () => {
    downloadCsv(
      `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`,
      rows.map((r) => ({
        "Bill #": r.number,
        Party: r.partyName,
        "Due date": r.dueDate,
        "Days overdue": r.daysOverdue,
        Bucket: r.bucket,
        Outstanding: r.outstanding,
      }))
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-foreground">
          {icon} {title}
        </h2>
        <Button size="sm" variant="outline" onClick={handleExport} disabled={rows.length === 0}>
          <Download className="size-3.5" /> Export CSV
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {BUCKETS.map((b) => (
          <div key={b} className="rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{b} days</p>
            <p className="mt-1 font-heading text-lg font-bold text-foreground">{inr.format(bucketTotals[b])}</p>
          </div>
        ))}
      </div>

      {/* Card layout below sm — the table's 6-7 columns don't fit a phone
          screen without hiding the point of the page (bucket/outstanding). */}
      <div className="mt-4 space-y-2 sm:hidden">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing outstanding.</p>
        ) : (
          rows
            .sort((a, b) => b.daysOverdue - a.daysOverdue)
            .map((r) => (
              <div key={r.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{r.number}</p>
                    <p className="truncate text-sm text-muted-foreground">{r.partyName}</p>
                  </div>
                  <Badge variant="secondary" className={`shrink-0 ${BUCKET_BADGE[r.bucket]}`}>{r.bucket}</Badge>
                </div>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <div className="text-sm text-muted-foreground">
                    <p>Due {r.dueDate}</p>
                    <p>{r.daysOverdue > 0 ? `${r.daysOverdue} days overdue` : `Due in ${-r.daysOverdue} days`}</p>
                  </div>
                  <p className="font-heading text-base font-bold text-foreground">{inr.format(r.outstanding)}</p>
                </div>
                {(onSendReminder || onUpdateStatus) && (
                  <div className="mt-3 flex gap-2">
                    {onUpdateStatus && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => onUpdateStatus(r)}>
                        <Wallet className="size-3.5" /> Update status
                      </Button>
                    )}
                    {onSendReminder && (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => onSendReminder(r)}>
                        <Mail className="size-3.5" /> Remind
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))
        )}
        {rows.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border-t border-border px-1 pt-2 font-semibold text-foreground">
            <span>Total outstanding</span>
            <span className="tabular-nums">{inr.format(total)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2 text-left">Bill #</th>
              <th className="py-2 text-left">Party</th>
              <th className="py-2 text-left">Due date</th>
              <th className="py-2 text-right">Days overdue</th>
              <th className="py-2 text-left">Bucket</th>
              <th className="py-2 text-right">Outstanding</th>
              {hasActions && <th className="py-2 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr><td colSpan={hasActions ? 7 : 6} className="py-6 text-center text-muted-foreground">Nothing outstanding.</td></tr>
            ) : (
              rows
                .sort((a, b) => b.daysOverdue - a.daysOverdue)
                .map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 font-medium text-foreground">{r.number}</td>
                    <td className="py-2 text-muted-foreground">{r.partyName}</td>
                    <td className="py-2 text-muted-foreground">{r.dueDate}</td>
                    <td className="py-2 text-right tabular-nums">{r.daysOverdue}</td>
                    <td className="py-2">
                      <Badge variant="secondary" className={BUCKET_BADGE[r.bucket]}>{r.bucket}</Badge>
                    </td>
                    <td className="py-2 text-right tabular-nums text-foreground">{inr.format(r.outstanding)}</td>
                    {hasActions && (
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          {onUpdateStatus && (
                            <Button size="icon-sm" variant="ghost" onClick={() => onUpdateStatus(r)} title="Update payment status">
                              <Wallet className="size-4" />
                            </Button>
                          )}
                          {onSendReminder && (
                            <Button size="icon-sm" variant="ghost" onClick={() => onSendReminder(r)} title="Send reminder">
                              <Mail className="size-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-border font-semibold text-foreground">
                <td className="py-2" colSpan={hasActions ? 6 : 5}>Total outstanding</td>
                <td className="py-2 text-right tabular-nums">{inr.format(total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

export function AgingClient({ user }: { user: SessionUser }) {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [parties, setParties] = React.useState<Party[]>([]);
  const [creditNotes, setCreditNotes] = React.useState<CreditNote[]>([]);
  const [debitNotes, setDebitNotes] = React.useState<DebitNote[]>([]);
  const [reminderRow, setReminderRow] = React.useState<AgingRow | null>(null);
  const [statusEditing, setStatusEditing] = React.useState<Sale | Purchase | null>(null);

  const canEdit = user.role === "admin" || user.role === "ca";

  React.useEffect(() => subscribeToSales(setSales), []);
  React.useEffect(() => subscribeToPurchases(setPurchases), []);
  React.useEffect(() => subscribeToParties(setParties), []);
  React.useEffect(() => subscribeToCreditNotes(setCreditNotes), []);
  React.useEffect(() => subscribeToDebitNotes(setDebitNotes), []);

  const emailById = new Map(parties.map((p) => [p.id, p.email]));

  const receivables: AgingRow[] = sales
    .map((s) => {
      const days = daysOverdue(s.dueDate);
      const outstanding = Math.round((s.grandTotal - s.amountReceived - creditNotedTotal(creditNotes, s.id)) * 100) / 100;
      return {
        id: s.id,
        number: s.invoiceNumber,
        partyName: s.customerName,
        partyEmail: emailById.get(s.customerId) ?? "",
        dueDate: s.dueDate,
        daysOverdue: days,
        bucket: agingBucket(days),
        outstanding,
      };
    })
    .filter((r) => r.outstanding > 0.01);

  const payables: AgingRow[] = purchases
    .map((p) => {
      const days = daysOverdue(p.dueDate);
      const outstanding = Math.round((p.grandTotal - p.amountPaid - debitNotedTotal(debitNotes, p.id)) * 100) / 100;
      return {
        id: p.id,
        number: p.billNumber,
        partyName: p.supplierName,
        partyEmail: emailById.get(p.supplierId) ?? "",
        dueDate: p.dueDate,
        daysOverdue: days,
        bucket: agingBucket(days),
        outstanding,
      };
    })
    .filter((r) => r.outstanding > 0.01);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Aging Report</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Outstanding receivables and payables, aged by days since due date.
      </p>

      <div className="mt-6 space-y-6">
        <AgingTable
          title="Receivables (customers owe you)"
          icon={<TrendingUp className="size-5 text-emerald-500" />}
          rows={receivables}
          onSendReminder={setReminderRow}
          onUpdateStatus={canEdit ? (row) => setStatusEditing(sales.find((s) => s.id === row.id) ?? null) : undefined}
        />
        <AgingTable
          title="Payables (you owe suppliers)"
          icon={<TrendingDown className="size-5 text-destructive" />}
          rows={payables}
          onUpdateStatus={canEdit ? (row) => setStatusEditing(purchases.find((p) => p.id === row.id) ?? null) : undefined}
        />
      </div>

      <SendReminderDialog open={!!reminderRow} onOpenChange={(open) => !open && setReminderRow(null)} row={reminderRow} />
      {canEdit && (
        <PaymentStatusDialog
          open={!!statusEditing}
          onOpenChange={(open) => !open && setStatusEditing(null)}
          bill={statusEditing}
          user={user}
        />
      )}
    </div>
  );
}
