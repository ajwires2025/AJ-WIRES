"use client";

import * as React from "react";
import { Loader2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSale } from "@/lib/accounts/sales";
import { SaleForm } from "@/components/accounts/sale-form";
import { PaymentStatusDialog } from "@/components/accounts/payment-status-dialog";
import { PAYMENT_STATUS_LABELS, type Sale } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

const STATUS_BADGE = {
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  partial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  unpaid: "bg-destructive/10 text-destructive",
} as const;

export function SaleDetailClient({ id, user }: { id: string; user: SessionUser }) {
  const [sale, setSale] = React.useState<Sale | null | undefined>(undefined);
  const [statusOpen, setStatusOpen] = React.useState(false);

  const canEdit = user.role === "admin" || user.role === "ca";

  const refetch = React.useCallback(() => {
    getSale(id).then(setSale);
  }, [id]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  if (sale === undefined) {
    return (
      <div className="flex items-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Loading invoice...
      </div>
    );
  }

  if (sale === null) {
    return <p className="py-16 text-center text-muted-foreground">Invoice not found.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Sales Invoice — {sale.invoiceNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{sale.customerName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={STATUS_BADGE[sale.paymentStatus]}>
            {PAYMENT_STATUS_LABELS[sale.paymentStatus]}
          </Badge>
          <p className="text-sm text-muted-foreground">
            Received {inr.format(sale.amountReceived)} / {inr.format(sale.grandTotal)}
          </p>
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => setStatusOpen(true)}>
              <Wallet className="size-3.5" /> Update Payment Status
            </Button>
          )}
        </div>
      </div>
      <div className="mt-6">
        <SaleForm sale={sale} user={user} />
      </div>

      {canEdit && (
        <PaymentStatusDialog
          open={statusOpen}
          onOpenChange={setStatusOpen}
          bill={sale}
          user={user}
          onUpdated={refetch}
        />
      )}
    </div>
  );
}
