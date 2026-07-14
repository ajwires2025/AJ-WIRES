import { getSessionUser } from "@/lib/firebase/session";
import { PayrollClient } from "@/components/accounts/payroll-client";

export default async function PayrollPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <PayrollClient user={user} />;
}
