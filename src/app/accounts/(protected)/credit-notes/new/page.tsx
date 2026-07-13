import { getSessionUser } from "@/lib/firebase/session";
import { CreditNoteForm } from "@/components/accounts/credit-note-form";

export default async function NewCreditNotePage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <CreditNoteForm user={user} />;
}
