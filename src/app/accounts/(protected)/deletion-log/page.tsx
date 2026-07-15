import { getSessionUser } from "@/lib/firebase/session";
import { DeletionLogClient } from "@/components/accounts/deletion-log-client";

export default async function DeletionLogPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <DeletionLogClient />;
}
