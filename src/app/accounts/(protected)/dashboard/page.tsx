import { getSessionUser } from "@/lib/firebase/session";
import { DashboardClient } from "@/components/accounts/dashboard-client";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <DashboardClient userName={user.name} />;
}
