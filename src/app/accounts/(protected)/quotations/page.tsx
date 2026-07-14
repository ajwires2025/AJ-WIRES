import { getSessionUser } from "@/lib/firebase/session";
import { QuotationsClient } from "@/components/accounts/quotations-client";

export default async function QuotationsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <QuotationsClient user={user} />;
}
