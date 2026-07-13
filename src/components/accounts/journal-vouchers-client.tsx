"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, BookOpen, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/accounts/confirm-delete-dialog";
import { subscribeToJournalVouchers, deleteJournalVoucher } from "@/lib/accounts/journal";
import type { JournalVoucher } from "@/lib/accounts/types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function JournalVouchersClient() {
  const [vouchers, setVouchers] = React.useState<JournalVoucher[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<JournalVoucher | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeToJournalVouchers((data) => {
      setVouchers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleDelete = async (voucher: JournalVoucher) => {
    try {
      await deleteJournalVoucher(voucher.id);
      toast.success("Voucher deleted");
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <BookOpen className="size-6 text-gold" /> Journal Vouchers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manual ledger adjustments for closing the books.</p>
        </div>
        <Button asChild className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
          <Link href="/accounts/journal-vouchers/new">
            <Plus className="size-4" /> New Voucher
          </Link>
        </Button>
      </div>

      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : vouchers.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No journal vouchers yet.</p>
        ) : (
          vouchers.map((v) => {
            const isOpen = expanded === v.id;
            return (
              <div key={v.id} className="overflow-hidden rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : v.id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/30"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {isOpen ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{v.narration}</p>
                      <p className="text-xs text-muted-foreground">{v.date} · {v.lines.length} lines</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="tabular-nums font-medium text-foreground">{inr.format(v.totalDebit)}</span>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleting(v);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-border bg-muted/20 p-4">
                    <table className="w-full text-sm">
                      <thead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="pb-2 text-left">Account</th>
                          <th className="pb-2 text-left">Type</th>
                          <th className="pb-2 text-right">Debit</th>
                          <th className="pb-2 text-right">Credit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {v.lines.map((line, i) => (
                          <tr key={i}>
                            <td className="py-1.5 text-foreground">{line.accountName}</td>
                            <td className="py-1.5 capitalize text-muted-foreground">{line.accountType}</td>
                            <td className="py-1.5 text-right tabular-nums text-foreground">{line.debit ? inr.format(line.debit) : "—"}</td>
                            <td className="py-1.5 text-right tabular-nums text-foreground">{line.credit ? inr.format(line.credit) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this journal voucher?"
        description="This can't be undone — its entries will be removed from the general ledger."
        onConfirm={() => handleDelete(deleting!)}
      />
    </div>
  );
}
