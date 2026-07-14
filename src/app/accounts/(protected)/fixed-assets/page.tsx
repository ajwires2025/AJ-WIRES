import { getSessionUser } from "@/lib/firebase/session";
import { FixedAssetsClient } from "@/components/accounts/fixed-assets-client";

export default async function FixedAssetsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <FixedAssetsClient user={user} />;
}
