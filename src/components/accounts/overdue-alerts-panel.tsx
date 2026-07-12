"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import { subscribeToSales } from "@/lib/accounts/sales";
import { subscribeToPurchases } from "@/lib/accounts/purchases";
import { daysOverdue } from "@/lib/accounts/aging";
import { subscribeToReminderSettings } from "@/lib/accounts/reminders";
import { DEFAULT_REMINDER_SETTINGS } from "@/lib/accounts/types";
import type { Sale, Purchase, ReminderSettings } from "@/lib/accounts/types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

type Status = "good" | "amber" | "red";

function statusFor(overdueCount: number, dueSoonCount: number): Status {
  if (overdueCount > 0) return "red";
  if (dueSoonCount > 0) return "amber";
  return "good";
}

const STATUS_STYLES: Record<Status, string> = {
  good: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  red: "border-destructive/30 bg-destructive/10 text-destructive",
};

const STATUS_ICON: Record<Status, React.ReactNode> = {
  good: <CheckCircle2 className="size-5" />,
  amber: <AlertTriangle className="size-5" />,
  red: <AlertTriangle className="size-5" />,
};

function AlertCard({
  title,
  icon,
  href,
  status,
  overdueCount,
  overdueAmount,
  dueSoonCount,
  dueSoonDays,
}: {
  title: string;
  icon: React.ReactNode;
  href: string;
  status: Status;
  overdueCount: number;
  overdueAmount: number;
  dueSoonCount: number;
  dueSoonDays: number;
}) {
  return (
    <Link href={href} className={`flex items-start gap-3 rounded-xl border p-4 transition-opacity hover:opacity-90 ${STATUS_STYLES[status]}`}>
      {STATUS_ICON[status]}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">{icon} {title}</p>
        {status === "good" ? (
          <p className="mt-0.5 text-sm">Nothing overdue right now.</p>
        ) : (
          <p className="mt-0.5 text-sm">
            {overdueCount > 0 && <>{overdueCount} overdue ({inr.format(overdueAmount)})</>}
            {overdueCount > 0 && dueSoonCount > 0 && " · "}
            {dueSoonCount > 0 && <>{dueSoonCount} due within {dueSoonDays} day{dueSoonDays === 1 ? "" : "s"}</>}
          </p>
        )}
      </div>
    </Link>
  );
}

export function OverdueAlertsPanel() {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [settings, setSettings] = React.useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);

  React.useEffect(() => subscribeToSales(setSales), []);
  React.useEffect(() => subscribeToPurchases(setPurchases), []);
  React.useEffect(() => subscribeToReminderSettings(setSettings), []);

  const openSales = sales.filter((s) => s.paymentStatus !== "paid");
  const openPurchases = purchases.filter((p) => p.paymentStatus !== "paid");

  const overdueSales = openSales.filter((s) => daysOverdue(s.dueDate) > 0);
  const dueSoonSales = openSales.filter((s) => {
    const d = daysOverdue(s.dueDate);
    return d <= 0 && d > -settings.dueSoonDays;
  });
  const overduePurchases = openPurchases.filter((p) => daysOverdue(p.dueDate) > 0);
  const dueSoonPurchases = openPurchases.filter((p) => {
    const d = daysOverdue(p.dueDate);
    return d <= 0 && d > -settings.dueSoonDays;
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <AlertCard
        title="Receivables"
        icon={<TrendingUp className="size-4" />}
        href="/accounts/aging"
        status={statusFor(overdueSales.length, dueSoonSales.length)}
        overdueCount={overdueSales.length}
        overdueAmount={overdueSales.reduce((s, x) => s + (x.grandTotal - x.amountReceived), 0)}
        dueSoonCount={dueSoonSales.length}
        dueSoonDays={settings.dueSoonDays}
      />
      <AlertCard
        title="Payables"
        icon={<TrendingDown className="size-4" />}
        href="/accounts/aging"
        status={statusFor(overduePurchases.length, dueSoonPurchases.length)}
        overdueCount={overduePurchases.length}
        overdueAmount={overduePurchases.reduce((s, x) => s + (x.grandTotal - x.amountPaid), 0)}
        dueSoonCount={dueSoonPurchases.length}
        dueSoonDays={settings.dueSoonDays}
      />
    </div>
  );
}
