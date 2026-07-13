import { getSessionUser } from "@/lib/firebase/session";
import { ExpensesClient } from "@/components/accounts/expenses-client";

export default async function ExpensesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <ExpensesClient user={user} />;
}
