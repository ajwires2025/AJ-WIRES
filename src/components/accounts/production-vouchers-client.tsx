"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Factory, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/accounts/confirm-delete-dialog";
import { subscribeToProductionVouchers, deleteProductionVoucher } from "@/lib/accounts/production";
import { UNIT_LABELS, type ProductionVoucher } from "@/lib/accounts/types";

const num = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 });
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function ProductionVouchersClient() {
  const [vouchers, setVouchers] = React.useState<ProductionVoucher[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState<ProductionVoucher | null>(null);

  React.useEffect(() => {
    const unsubscribe = subscribeToProductionVouchers((data) => {
      setVouchers(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleDelete = async (voucher: ProductionVoucher) => {
    try {
      await deleteProductionVoucher(voucher.id);
      toast.success("Production entry deleted");
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <Factory className="size-6 text-gold" /> Production
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Raw material → finished good conversions.</p>
        </div>
        <Button asChild className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy">
          <Link href="/accounts/production/new">
            <Plus className="size-4" /> New Production Entry
          </Link>
        </Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Finished Good</th>
                <th className="px-4 py-3 text-right">Qty Produced</th>
                <th className="px-4 py-3 text-right">Material Cost</th>
                <th className="px-4 py-3 text-right">Total Cost</th>
                <th className="px-4 py-3 text-right">Unit Cost</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No production entries yet.</td></tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{v.date}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{v.finishedItemName}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{num.format(v.quantityProduced)} {UNIT_LABELS[v.unit]}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(v.materialCost)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(v.totalCost)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(v.unitCost)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleting(v)}>
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
        title="Delete this production entry?"
        description="This can't be undone — the consumed raw materials and produced finished-good stock will be reversed."
        onConfirm={() => handleDelete(deleting!)}
      />
    </div>
  );
}
