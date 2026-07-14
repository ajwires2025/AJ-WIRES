"use client";

import * as React from "react";
import { Loader2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPurchase } from "@/lib/accounts/purchases";
import { PurchaseForm } from "@/components/accounts/purchase-form";
import { PaymentStatusDialog } from "@/components/accounts/payment-status-dialog";
import { PAYMENT_STATUS_LABELS, type Purchase } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

const STATUS_BADGE = {
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  partial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  unpaid: "bg-destructive/10 text-destructive",
} as const;

export function PurchaseDetailClient({ id, user }: { id: string; user: SessionUser }) {
  const [purchase, setPurchase] = React.useState<Purchase | null | undefined>(undefined);
  const [statusOpen, setStatusOpen] = React.useState(false);

  const canEdit = user.role === "admin" || user.role === "ca";

  const refetch = React.useCallback(() => {
    getPurchase(id).then(setPurchase);
  }, [id]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  if (purchase === undefined) {
    return (
      <div className="flex items-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Loading purchase...
      </div>
    );
  }

  if (purchase === null) {
    return <p className="py-16 text-center text-muted-foreground">Purchase not found.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Purchase Bill — {purchase.billNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{purchase.supplierName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={STATUS_BADGE[purchase.paymentStatus]}>
            {PAYMENT_STATUS_LABELS[purchase.paymentStatus]}
          </Badge>
          <p className="text-sm text-muted-foreground">
            Paid {inr.format(purchase.amountPaid)} / {inr.format(purchase.grandTotal)}
          </p>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setStatusOpen(true)}>
              <Wallet className="size-3.5" /> Update Payment Status
            </Button>
          )}
        </div>
      </div>
      <div className="mt-6">
        <PurchaseForm purchase={purchase} user={user} />
      </div>

      {canEdit && (
        <PaymentStatusDialog
          open={statusOpen}
          onOpenChange={setStatusOpen}
          bill={purchase}
          user={user}
          onUpdated={refetch}
        />
      )}
    </div>
  );
}
