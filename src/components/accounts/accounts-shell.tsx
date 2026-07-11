"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
  Package,
  ShoppingCart,
  Receipt,
  Wallet,
  TrendingUp,
  Menu,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { auth } from "@/lib/firebase/client";
import type { SessionUser } from "@/lib/firebase/session";

const navItems = [
  { href: "/accounts/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/accounts/sales", label: "Sales", icon: Receipt },
  { href: "/accounts/payments", label: "Payments", icon: Wallet },
  { href: "/accounts/aging", label: "Aging", icon: TrendingUp },
  { href: "/accounts/stock-ledger", label: "Stock", icon: Boxes },
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
  const pathname = usePathname();

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
            <ShieldCheck className="size-5 shrink-0 text-gold" />
            <span className="font-heading text-sm font-semibold whitespace-nowrap">A.J. Wires Accounts</span>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium hover:bg-white/10 hover:text-white",
                  pathname === item.href ? "bg-white/10 text-white" : "text-white/70"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium text-white">{user.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-gold-light">{user.role}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSignOut}
              className="hidden border-white/20 bg-white/5 text-white hover:bg-white/15 hover:text-white sm:inline-flex"
            >
              <LogOut className="size-3.5" /> Sign out
            </Button>

            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Open menu"
                    className="text-white hover:bg-white/10 hover:text-white"
                  >
                    <Menu className="size-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[360px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 font-heading">
                      <ShieldCheck className="size-5 text-gold" /> A.J. Wires Accounts
                    </SheetTitle>
                  </SheetHeader>
                  <div className="px-4 pb-2">
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{user.role}</p>
                  </div>
                  <nav className="flex flex-col gap-1 px-4">
                    {navItems.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-base font-medium transition-colors hover:bg-muted",
                            pathname === item.href ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          <item.icon className="size-4.5" /> {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </nav>
                  <div className="mt-4 px-4">
                    <SheetClose asChild>
                      <Button variant="outline" className="w-full" onClick={handleSignOut}>
                        <LogOut className="size-4" /> Sign out
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
