import { getSessionUser } from "@/lib/firebase/session";
import { PurchaseOrderForm } from "@/components/accounts/purchase-order-form";

export default async function NewPurchaseOrderPage() {
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">New Purchase Order</h1>
      <p className="mt-1 text-sm text-muted-foreground">Draft a pre-bill commitment to a supplier.</p>
      <div className="mt-6">
        <PurchaseOrderForm po={null} user={user} />
      </div>
    </div>
  );
}
