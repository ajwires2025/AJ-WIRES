import { getSessionUser } from "@/lib/firebase/session";
import { SaleDetailClient } from "@/components/accounts/sale-detail-client";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;
  return <SaleDetailClient id={id} user={user} />;
}
