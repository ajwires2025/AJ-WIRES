import { getSessionUser } from "@/lib/firebase/session";
import { JournalVoucherForm } from "@/components/accounts/journal-voucher-form";

export default async function NewJournalVoucherPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <JournalVoucherForm user={user} />;
}
