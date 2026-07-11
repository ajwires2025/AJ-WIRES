import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { SaleForm } from "@/components/accounts/sale-form";

export default async function NewSalePage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role !== "admin") redirect("/accounts/sales");

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">Add Sales Invoice</h1>
      <p className="mt-1 text-sm text-muted-foreground">Record an invoice issued to a customer.</p>
      <div className="mt-6">
        <SaleForm sale={null} user={user} />
      </div>
    </div>
  );
}
