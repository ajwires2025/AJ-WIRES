import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { AccountsShell } from "@/components/accounts/accounts-shell";

export default async function ProtectedAccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/accounts/login");
  }

  return <AccountsShell user={user}>{children}</AccountsShell>;
}
