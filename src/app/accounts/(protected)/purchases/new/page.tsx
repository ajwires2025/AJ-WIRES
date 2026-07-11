import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { PurchaseForm } from "@/components/accounts/purchase-form";

export default async function NewPurchasePage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "admin") redirect("/accounts/purchases");

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Add Purchase Bill</h1>
      <p className="mt-1 text-sm text-muted-foreground">Record a bill received from a supplier.</p>
      <div className="mt-6">
        <PurchaseForm purchase={null} user={user} />
      </div>
    </div>
  );
}
