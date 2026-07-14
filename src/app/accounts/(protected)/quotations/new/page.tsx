import { getSessionUser } from "@/lib/firebase/session";
import { QuotationForm } from "@/components/accounts/quotation-form";

export default async function NewQuotationPage() {
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">New Quotation</h1>
      <p className="mt-1 text-sm text-muted-foreground">Draft a pre-invoice offer for a customer.</p>
      <div className="mt-6">
        <QuotationForm quotation={null} user={user} />
      </div>
    </div>
  );
}
