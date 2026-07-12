import { getSessionUser } from "@/lib/firebase/session";
import { CashFlowClient } from "@/components/accounts/cash-flow-client";

export default async function CashFlowPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <CashFlowClient />;
}
