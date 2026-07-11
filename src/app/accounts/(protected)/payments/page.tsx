import { getSessionUser } from "@/lib/firebase/session";
import { PaymentsClient } from "@/components/accounts/payments-client";

export default async function PaymentsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <PaymentsClient user={user} />;
}
