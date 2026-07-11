"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { getSale } from "@/lib/accounts/sales";
import { SaleForm } from "@/components/accounts/sale-form";
import type { Sale } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

export function SaleDetailClient({ id, user }: { id: string; user: SessionUser }) {
  const [sale, setSale] = React.useState<Sale | null | undefined>(undefined);

  React.useEffect(() => {
    getSale(id).then(setSale);
  }, [id]);

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
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Sales Invoice — {sale.invoiceNumber}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{sale.customerName}</p>
      <div className="mt-6">
        <SaleForm sale={sale} user={user} />
      </div>
    </div>
  );
}
