import { getSessionUser } from "@/lib/firebase/session";
import { BalanceSheetClient } from "@/components/accounts/balance-sheet-client";

export default async function BalanceSheetPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <BalanceSheetClient />;
}
