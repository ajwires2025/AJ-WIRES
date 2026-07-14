"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { getPurchaseOrder } from "@/lib/accounts/purchase-orders";
import { PurchaseOrderForm } from "@/components/accounts/purchase-order-form";
import type { PurchaseOrder } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

export function PurchaseOrderDetailClient({ id, user }: { id: string; user: SessionUser }) {
  const [po, setPo] = React.useState<PurchaseOrder | null | undefined>(undefined);

  React.useEffect(() => {
    getPurchaseOrder(id).then(setPo);
  }, [id]);

  if (po === undefined) {
    return (
      <div className="flex items-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Loading purchase order...
      </div>
    );
  }

  if (po === null) {
    return <p className="py-16 text-center text-muted-foreground">Purchase order not found.</p>;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Purchase Order — {po.poNumber}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{po.supplierName}</p>
      <div className="mt-6">
        <PurchaseOrderForm po={po} user={user} />
      </div>
    </div>
  );
}
