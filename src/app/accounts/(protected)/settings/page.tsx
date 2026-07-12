import { getSessionUser } from "@/lib/firebase/session";
import { SettingsClient } from "@/components/accounts/settings-client";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  return <SettingsClient />;
}
