import { getSessionUser } from "@/lib/firebase/session";
import { StockLedgerClient } from "@/components/accounts/stock-ledger-client";

export default async function StockLedgerPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <StockLedgerClient />;
}
