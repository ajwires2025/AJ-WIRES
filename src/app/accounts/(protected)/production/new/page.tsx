import { getSessionUser } from "@/lib/firebase/session";
import { ProductionVoucherForm } from "@/components/accounts/production-voucher-form";

export default async function NewProductionPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <ProductionVoucherForm user={user} />;
}
