import { getSessionUser } from "@/lib/firebase/session";
import { SalesClient } from "@/components/accounts/sales-client";

export default async function SalesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <SalesClient user={user} />;
}
