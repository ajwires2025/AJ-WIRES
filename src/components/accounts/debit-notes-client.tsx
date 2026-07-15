"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, FilePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/accounts/confirm-delete-dialog";
import { subscribeToDebitNotes, deleteDebitNote } from "@/lib/accounts/debit-notes";
import type { DebitNote } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function DebitNotesClient({ user }: { user: SessionUser }) {
  const [notes, setNotes] = React.useState<DebitNote[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState<DebitNote | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeToDebitNotes((data) => {
      setNotes(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleDelete = async (note: DebitNote) => {
    try {
      await deleteDebitNote(note.id, user.uid, user.name);
      toast.success("Debit note deleted");
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <FilePlus className="size-6 text-gold" /> Debit Notes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Purchase returns and reductions against received bills.</p>
        </div>
        <Button asChild className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
          <Link href="/accounts/debit-notes/new">
            <Plus className="size-4" /> New Debit Note
          </Link>
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Note #</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Against Bill</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
              ) : notes.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No debit notes yet.</td></tr>
              ) : (
                notes.map((n) => (
                  <tr key={n.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{n.noteNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{n.noteDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{n.supplierName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{n.linkedBillNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{n.reason}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(n.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleting(n)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete debit note ${deleting?.noteNumber}?`}
        description="This can't be undone — the linked bill's outstanding balance will increase back to its original amount."
        onConfirm={() => handleDelete(deleting!)}
      />
    </div>
  );
}
