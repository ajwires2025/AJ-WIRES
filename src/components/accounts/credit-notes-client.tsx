"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, FileMinus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/accounts/confirm-delete-dialog";
import { subscribeToCreditNotes, deleteCreditNote } from "@/lib/accounts/credit-notes";
import type { CreditNote } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function CreditNotesClient({ user }: { user: SessionUser }) {
  const [notes, setNotes] = React.useState<CreditNote[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState<CreditNote | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeToCreditNotes((data) => {
      setNotes(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleDelete = async (note: CreditNote) => {
    try {
      await deleteCreditNote(note.id, user.uid, user.name);
      toast.success("Credit note deleted");
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <FileMinus className="size-6 text-gold" /> Credit Notes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Sales returns and reductions against issued invoices.</p>
        </div>
        <Button asChild className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
          <Link href="/accounts/credit-notes/new">
            <Plus className="size-4" /> New Credit Note
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
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Against Invoice</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
              ) : notes.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No credit notes yet.</td></tr>
              ) : (
                notes.map((n) => (
                  <tr key={n.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{n.noteNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{n.noteDate}</td>
                    <td className="px-4 py-3 text-muted-foreground">{n.customerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{n.linkedInvoiceNumber}</td>
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
        title={`Delete credit note ${deleting?.noteNumber}?`}
        description="This can't be undone — the linked invoice's outstanding balance will increase back to its original amount."
        onConfirm={() => handleDelete(deleting!)}
      />
    </div>
  );
}
