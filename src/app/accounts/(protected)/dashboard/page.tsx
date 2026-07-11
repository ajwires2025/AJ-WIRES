import { getSessionUser } from "@/lib/firebase/session";

export default async function DashboardPage() {
  const user = await getSessionUser();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Welcome, {user?.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Signed in as <span className="font-medium">{user?.role}</span>. Purchases, sales,
        payments, and reports land here in the next milestones.
      </p>
    </div>
  );
}
