"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { getPurchase } from "@/lib/accounts/purchases";
import { PurchaseForm } from "@/components/accounts/purchase-form";
import type { Purchase } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

export function PurchaseDetailClient({ id, user }: { id: string; user: SessionUser }) {
  const [purchase, setPurchase] = React.useState<Purchase | null | undefined>(undefined);

  React.useEffect(() => {
    getPurchase(id).then(setPurchase);
  }, [id]);

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
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Purchase Bill — {purchase.billNumber}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{purchase.supplierName}</p>
      <div className="mt-6">
        <PurchaseForm purchase={purchase} user={user} />
      </div>
    </div>
  );
}
