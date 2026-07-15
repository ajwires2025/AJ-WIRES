import { getSessionUser } from "@/lib/firebase/session";
import { JournalVouchersClient } from "@/components/accounts/journal-vouchers-client";

export default async function JournalVouchersPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <JournalVouchersClient user={user} />;
}
