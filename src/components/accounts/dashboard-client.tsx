"use client";

import * as React from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
} from "recharts";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Percent,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  ShoppingCart,
  Scale,
  FileText,
  Landmark,
  CheckCircle2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subscribeToSales } from "@/lib/accounts/sales";
import { subscribeToPurchases } from "@/lib/accounts/purchases";
import { subscribeToPayments } from "@/lib/accounts/payments";
import { subscribeToExpenses } from "@/lib/accounts/expenses";
import { subscribeToFixedAssets } from "@/lib/accounts/fixed-assets";
import { subscribeToTdsChallans } from "@/lib/accounts/tds-challans";
import { subscribeToPayslips } from "@/lib/accounts/payslips";
import {
  calcDashboardSummary,
  buildMonthlyTrend,
  topCustomersByValue,
  topItemsByValue,
} from "@/lib/accounts/dashboard";
import { currentMonthKey, lastMonthKeys, monthPeriod, financialYearPeriod, type Period } from "@/lib/accounts/period";
import { currentFinancialYearKey } from "@/lib/accounts/invoice-number";
import { OverdueAlertsPanel } from "@/components/accounts/overdue-alerts-panel";
import { LowStockAlertsPanel } from "@/components/accounts/low-stock-alerts-panel";
import type { Sale, Purchase, Payment, Expense, FixedAsset, TdsChallan, Payslip } from "@/lib/accounts/types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrCompact = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 });

// Chart palette — validated 2-slot categorical pair (dataviz skill):
// gold reads as "Sales" against the site's own accent, blue as "Purchases".
const CHART_COLORS = {
  sales: "var(--gold, #eda100)",
  purchases: "#2a78d6",
  profit: "#1baf7a",
};

function Tile({
  label,
  value,
  icon,
  tone = "default",
  href,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "default" | "good" | "bad";
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <span
          className={
            tone === "good"
              ? "text-emerald-500"
              : tone === "bad"
                ? "text-destructive"
                : "text-gold"
          }
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 font-heading text-xl font-bold text-foreground sm:text-2xl">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-gold/40 hover:bg-gold/5">
        {content}
      </Link>
    );
  }

  return <div className="rounded-xl border border-border bg-card p-4">{content}</div>;
}

const REPORT_LINKS = [
  { href: "/accounts/pnl", label: "Profit & Loss", icon: FileText },
  { href: "/accounts/cash-flow", label: "Cash Flow", icon: Wallet },
  { href: "/accounts/aging", label: "Aged Receivables & Payables", icon: TrendingUp },
  { href: "/accounts/reconciliation", label: "Reconciliation", icon: CheckCircle2 },
  { href: "/accounts/ledger", label: "General Ledger", icon: Scale },
  { href: "/accounts/balance-sheet", label: "Balance Sheet", icon: Landmark },
  { href: "/accounts/fixed-assets", label: "Fixed Assets", icon: Landmark },
];

export function DashboardClient({ userName }: { userName: string }) {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [purchases, setPurchases] = React.useState<Purchase[]>([]);
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [fixedAssets, setFixedAssets] = React.useState<FixedAsset[]>([]);
  const [tdsChallans, setTdsChallans] = React.useState<TdsChallan[]>([]);
  const [payslips, setPayslips] = React.useState<Payslip[]>([]);
  const [periodMode, setPeriodMode] = React.useState<"month" | "fy">("month");
  const [monthKey, setMonthKey] = React.useState(currentMonthKey());

  React.useEffect(() => subscribeToSales(setSales), []);
  React.useEffect(() => subscribeToPurchases(setPurchases), []);
  React.useEffect(() => subscribeToPayments(setPayments), []);
  React.useEffect(() => subscribeToExpenses(setExpenses), []);
  React.useEffect(() => subscribeToFixedAssets(setFixedAssets), []);
  React.useEffect(() => subscribeToTdsChallans(setTdsChallans), []);
  React.useEffect(() => subscribeToPayslips(setPayslips), []);

  const period: Period = periodMode === "fy" ? financialYearPeriod() : monthPeriod(monthKey);
  const summary = calcDashboardSummary(sales, purchases, payments, expenses, fixedAssets, tdsChallans, payslips, period);
  const trend = buildMonthlyTrend(sales, purchases, lastMonthKeys(12));
  const topCustomers = topCustomersByValue(sales, period);
  const topItems = topItemsByValue(sales, period);

  const monthOptions = lastMonthKeys(12).map((key) => ({ key, label: monthPeriod(key).label }));

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Welcome, {userName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {periodMode === "fy" ? `Financial Year ${currentFinancialYearKey()}` : period.label}
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={periodMode} onValueChange={(v) => setPeriodMode(v as "month" | "fy")}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="fy">This FY</SelectItem>
            </SelectContent>
          </Select>
          {periodMode === "month" && (
            <Select value={monthKey} onValueChange={setMonthKey}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="mt-6">
        <OverdueAlertsPanel />
      </div>
      <div className="mt-3">
        <LowStockAlertsPanel />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Tile label="Total Sales" value={inr.format(summary.totalSales)} icon={<Receipt className="size-5" />} href="/accounts/sales" />
        <Tile label="Total Purchases" value={inr.format(summary.totalPurchases)} icon={<ShoppingCart className="size-5" />} href="/accounts/purchases" />
        <Tile
          label="Gross Profit"
          value={inr.format(summary.grossProfit)}
          icon={<TrendingUp className="size-5" />}
          tone={summary.grossProfit >= 0 ? "good" : "bad"}
          href="/accounts/pnl"
        />
        <Tile
          label="Net Profit"
          value={inr.format(summary.netProfit)}
          icon={<TrendingUp className="size-5" />}
          tone={summary.netProfit >= 0 ? "good" : "bad"}
          href="/accounts/pnl"
        />
        <Tile label="Margin %" value={`${summary.marginPercent}%`} icon={<Percent className="size-5" />} href="/accounts/pnl" />
        <Tile label="Output GST" value={inr.format(summary.outputGst)} icon={<IndianRupee className="size-5" />} href="/accounts/gst-summary" />
        <Tile label="Input GST" value={inr.format(summary.inputGst)} icon={<IndianRupee className="size-5" />} href="/accounts/gst-summary" />
        <Tile
          label="Net GST"
          value={inr.format(summary.netGst)}
          icon={<Scale className="size-5" />}
          tone={summary.netGst >= 0 ? "bad" : "good"}
          href="/accounts/gst-summary"
        />
        <Tile label="Cash Received" value={inr.format(summary.cashReceived)} icon={<ArrowDownRight className="size-5" />} tone="good" href="/accounts/payments?direction=received" />
        <Tile label="Cash Paid" value={inr.format(summary.cashPaid)} icon={<ArrowUpRight className="size-5" />} tone="bad" href="/accounts/payments?direction=paid" />
        <Tile label="Total Receivables" value={inr.format(summary.totalReceivables)} icon={<TrendingUp className="size-5" />} href="/accounts/aging" />
        <Tile label="Total Payables" value={inr.format(summary.totalPayables)} icon={<TrendingDown className="size-5" />} href="/accounts/aging" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="font-heading text-base font-semibold text-foreground">Sales vs Purchases (last 12 months)</h2>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend} margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis tickFormatter={(v) => inrCompact.format(v)} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" width={64} />
                <Tooltip formatter={(v) => inr.format(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Bar dataKey="sales" name="Sales" fill={CHART_COLORS.sales} radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchases" name="Purchases" fill={CHART_COLORS.purchases} radius={[4, 4, 0, 0]} />
                <Line dataKey="profit" name="Gross Profit" stroke={CHART_COLORS.profit} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-base font-semibold text-foreground">Top Customers ({period.label})</h2>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCustomers} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => inrCompact.format(v)} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} stroke="var(--muted-foreground)" />
                <Tooltip formatter={(v) => inr.format(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                <Bar dataKey="value" name="Sales value" fill={CHART_COLORS.sales} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {topCustomers.length === 0 && (
            <p className="mt-2 text-center text-sm text-muted-foreground">No sales in this period yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-heading text-base font-semibold text-foreground">Top Items ({period.label})</h2>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topItems} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => inrCompact.format(v)} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={110} stroke="var(--muted-foreground)" />
                <Tooltip formatter={(v) => inr.format(Number(v))} contentStyle={{ borderRadius: 8, fontSize: 13 }} />
                <Bar dataKey="value" name="Sales value" fill={CHART_COLORS.purchases} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {topItems.length === 0 && (
            <p className="mt-2 text-center text-sm text-muted-foreground">No sales in this period yet.</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-heading text-base font-semibold text-foreground">CA Reports</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {REPORT_LINKS.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-gold/40 hover:bg-gold/5"
            >
              <r.icon className="size-5 text-gold" />
              <span className="text-xs font-medium text-foreground">{r.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
