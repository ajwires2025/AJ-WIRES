import { getSessionUser } from "@/lib/firebase/session";
import { TdsSummaryClient } from "@/components/accounts/tds-summary-client";

export default async function TdsSummaryPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <TdsSummaryClient user={user} />;
}
