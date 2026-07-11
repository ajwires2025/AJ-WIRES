"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, ShieldCheck, Users, Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/client";
import type { SessionUser } from "@/lib/firebase/session";

const navItems = [
  { href: "/accounts/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/accounts/parties", label: "Parties", icon: Users },
  { href: "/accounts/items", label: "Items", icon: Package },
];

export function AccountsShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await fetch("/api/accounts/session", { method: "DELETE" });
      await signOut(auth);
      router.push("/accounts/login");
      router.refresh();
    } catch {
      toast.error("Couldn't sign out. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-navy">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="size-5 text-gold" />
            <span className="font-heading text-sm font-semibold">A.J. Wires Accounts</span>
          </div>
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-white">{user.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-gold-light">{user.role}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSignOut}
              className="border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white"
            >
              <LogOut className="size-3.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
