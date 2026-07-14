"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { getQuotation } from "@/lib/accounts/quotations";
import { QuotationForm } from "@/components/accounts/quotation-form";
import type { Quotation } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

export function QuotationDetailClient({ id, user }: { id: string; user: SessionUser }) {
  const [quotation, setQuotation] = React.useState<Quotation | null | undefined>(undefined);

  React.useEffect(() => {
    getQuotation(id).then(setQuotation);
  }, [id]);

  if (quotation === undefined) {
    return (
      <div className="flex items-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Loading quotation...
      </div>
    );
  }

  if (quotation === null) {
    return <p className="py-16 text-center text-muted-foreground">Quotation not found.</p>;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Quotation — {quotation.quoteNumber}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{quotation.customerName}</p>
      <div className="mt-6">
        <QuotationForm quotation={quotation} user={user} />
      </div>
    </div>
  );
}
