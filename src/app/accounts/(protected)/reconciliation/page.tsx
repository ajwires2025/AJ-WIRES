import { getSessionUser } from "@/lib/firebase/session";
import { ReconciliationClient } from "@/components/accounts/reconciliation-client";

export default async function ReconciliationPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <ReconciliationClient />;
}
