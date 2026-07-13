import { getSessionUser } from "@/lib/firebase/session";
import { DebitNoteForm } from "@/components/accounts/debit-note-form";

export default async function NewDebitNotePage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <DebitNoteForm user={user} />;
}
