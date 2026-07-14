import { getSessionUser } from "@/lib/firebase/session";
import { PartyStatementClient } from "@/components/accounts/party-statement-client";

export default async function PartyStatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const { id } = await params;
  return <PartyStatementClient id={id} />;
}
