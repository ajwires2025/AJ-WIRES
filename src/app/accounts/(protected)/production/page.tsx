import { getSessionUser } from "@/lib/firebase/session";
import { ProductionVouchersClient } from "@/components/accounts/production-vouchers-client";

export default async function ProductionPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <ProductionVouchersClient user={user} />;
}
