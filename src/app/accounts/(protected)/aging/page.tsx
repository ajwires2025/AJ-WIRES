import { getSessionUser } from "@/lib/firebase/session";
import { AgingClient } from "@/components/accounts/aging-client";

export default async function AgingPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <AgingClient user={user} />;
}
