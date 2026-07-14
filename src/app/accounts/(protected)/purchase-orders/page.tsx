import { getSessionUser } from "@/lib/firebase/session";
import { PurchaseOrdersClient } from "@/components/accounts/purchase-orders-client";

export default async function PurchaseOrdersPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <PurchaseOrdersClient user={user} />;
}
