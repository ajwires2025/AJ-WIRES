import { getSessionUser } from "@/lib/firebase/session";
import { QuotationDetailClient } from "@/components/accounts/quotation-detail-client";

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;
  return <QuotationDetailClient id={id} user={user} />;
}
