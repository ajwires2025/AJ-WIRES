import { getSessionUser } from "@/lib/firebase/session";
import { DebitNotesClient } from "@/components/accounts/debit-notes-client";

export default async function DebitNotesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <DebitNotesClient user={user} />;
}
