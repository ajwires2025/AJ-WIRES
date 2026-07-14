import { getSessionUser } from "@/lib/firebase/session";
import { EmployeesClient } from "@/components/accounts/employees-client";

export default async function EmployeesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <EmployeesClient user={user} />;
}
