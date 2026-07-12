import { getSessionUser } from "@/lib/firebase/session";
import { RemindersLogClient } from "@/components/accounts/reminders-log-client";

export default async function RemindersLogPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <RemindersLogClient />;
}
