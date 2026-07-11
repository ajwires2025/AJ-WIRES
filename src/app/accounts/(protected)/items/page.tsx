import { getSessionUser } from "@/lib/firebase/session";
import { ItemsClient } from "@/components/accounts/items-client";

export default async function ItemsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <ItemsClient user={user} />;
}
