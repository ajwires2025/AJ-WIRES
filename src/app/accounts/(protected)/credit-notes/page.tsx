import { getSessionUser } from "@/lib/firebase/session";
import { CreditNotesClient } from "@/components/accounts/credit-notes-client";

export default async function CreditNotesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <CreditNotesClient user={user} />;
}
