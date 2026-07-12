import { getSessionUser } from "@/lib/firebase/session";
import { TrialBalanceClient } from "@/components/accounts/trial-balance-client";

export default async function TrialBalancePage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <TrialBalanceClient />;
}
