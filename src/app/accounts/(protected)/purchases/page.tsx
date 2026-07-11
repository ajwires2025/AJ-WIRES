import { getSessionUser } from "@/lib/firebase/session";
import { PurchasesClient } from "@/components/accounts/purchases-client";

export default async function PurchasesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <PurchasesClient user={user} />;
}
