import { getSessionUser } from "@/lib/firebase/session";
import { PurchaseOrderDetailClient } from "@/components/accounts/purchase-order-detail-client";

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;
  return <PurchaseOrderDetailClient id={id} user={user} />;
}
