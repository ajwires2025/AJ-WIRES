import { getSessionUser } from "@/lib/firebase/session";
import { PnlClient } from "@/components/accounts/pnl-client";

export default async function PnlPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <PnlClient />;
}
