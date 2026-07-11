import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";

export default async function AccountsIndexPage() {
  const user = await getSessionUser();
  redirect(user ? "/accounts/dashboard" : "/accounts/login");
}
