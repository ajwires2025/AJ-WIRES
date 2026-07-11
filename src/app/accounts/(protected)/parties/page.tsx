import { getSessionUser } from "@/lib/firebase/session";
import { PartiesClient } from "@/components/accounts/parties-client";

export default async function PartiesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <PartiesClient user={user} />;
}
