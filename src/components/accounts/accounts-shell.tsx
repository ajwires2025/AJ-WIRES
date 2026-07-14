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
  ReceiptText,
  TrendingUp,
  Menu,
  Boxes,
  BookOpen,
  Scale,
  Landmark,
  ChevronDown,
  BarChart3,
  FileText,
  CheckCircle2,
  History,
  Settings,
  FileMinus,
  FilePlus,
  Factory,
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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { auth } from "@/lib/firebase/client";
import type { SessionUser } from "@/lib/firebase/session";

const primaryNavItems = [
  { href: "/accounts/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts/purchases", label: "Purchases", icon: ShoppingCart },
  { href: "/accounts/sales", label: "Sales", icon: Receipt },
  { href: "/accounts/credit-notes", label: "Credit Notes", icon: FileMinus },
  { href: "/accounts/debit-notes", label: "Debit Notes", icon: FilePlus },
  { href: "/accounts/payments", label: "Payments", icon: Wallet },
  { href: "/accounts/expenses", label: "Expenses", icon: ReceiptText },
  { href: "/accounts/journal-vouchers", label: "Journal Vouchers", icon: BookOpen },
  { href: "/accounts/production", label: "Production", icon: Factory },
];

const reportNavItems = [
  { href: "/accounts/pnl", label: "Profit & Loss", icon: FileText },
  { href: "/accounts/cash-flow", label: "Cash Flow", icon: Wallet },
  { href: "/accounts/aging", label: "Aging", icon: TrendingUp },
  { href: "/accounts/reconciliation", label: "Reconciliation", icon: CheckCircle2 },
  { href: "/accounts/reminders-log", label: "Reminders Log", icon: History },
  { href: "/accounts/stock-ledger", label: "Stock Ledger", icon: Boxes },
  { href: "/accounts/ledger", label: "General Ledger", icon: BookOpen },
  { href: "/accounts/trial-balance", label: "Trial Balance", icon: Scale },
  { href: "/accounts/balance-sheet", label: "Balance Sheet", icon: Landmark },
];

const masterDataNavItems = [
  { href: "/accounts/parties", label: "Parties", icon: Users },
  { href: "/accounts/items", label: "Items", icon: Package },
  { href: "/accounts/settings", label: "Settings", icon: Settings },
];

const allNavItems = [...primaryNavItems, ...reportNavItems, ...masterDataNavItems];

export function AccountsShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isReportsActive = reportNavItems.some((item) => item.href === pathname);

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

  const linkClass = (active: boolean) =>
    cn(
      "rounded-md px-3 py-1.5 text-sm font-medium hover:bg-white/10 hover:text-white",
      active ? "bg-white/10 text-white" : "text-white/70"
    );

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-navy">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="size-5 shrink-0 text-gold" />
            <span className="font-heading text-sm font-semibold whitespace-nowrap">A.J. Wires Accounts</span>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {primaryNavItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(pathname === item.href)}>
                {item.label}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(linkClass(isReportsActive), "flex items-center gap-1")}>
                  <BarChart3 className="size-4" /> Reports <ChevronDown className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {reportNavItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className={pathname === item.href ? "bg-accent" : ""}>
                      <item.icon className="size-4" /> {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {masterDataNavItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(pathname === item.href)}>
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
                <SheetContent side="right" className="w-[300px] overflow-y-auto sm:w-[360px]">
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
                    {allNavItems.map((item) => (
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
