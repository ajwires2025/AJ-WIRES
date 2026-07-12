import { getSessionUser } from "@/lib/firebase/session";
import { GeneralLedgerClient } from "@/components/accounts/general-ledger-client";

export default async function LedgerPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <GeneralLedgerClient />;
}
