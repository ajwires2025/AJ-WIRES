import { getSessionUser } from "@/lib/firebase/session";
import { PurchaseDetailClient } from "@/components/accounts/purchase-detail-client";

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;
  return <PurchaseDetailClient id={id} user={user} />;
}
