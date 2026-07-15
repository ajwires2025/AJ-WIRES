"use client";

import * as React from "react";
import { Plus, Search, Landmark, ChevronDown, ChevronRight, Pencil, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FixedAssetFormDialog } from "@/components/accounts/fixed-asset-form-dialog";
import { ConfirmDeleteDialog } from "@/components/accounts/confirm-delete-dialog";
import { subscribeToFixedAssets, deleteFixedAsset } from "@/lib/accounts/fixed-assets";
import { computeAssetSchedule, currentBookValue } from "@/lib/accounts/depreciation";
import { downloadCsv } from "@/lib/accounts/csv";
import {
  ASSET_CATEGORIES,
  DEPRECIATION_METHOD_LABELS,
  type FixedAsset,
  type AssetCategory,
} from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function FixedAssetsClient({ user }: { user: SessionUser }) {
  const [assets, setAssets] = React.useState<FixedAsset[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<"all" | AssetCategory>("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingAsset, setEditingAsset] = React.useState<FixedAsset | null>(null);
  const [deletingAsset, setDeletingAsset] = React.useState<FixedAsset | null>(null);

  const canEdit = user.role === "admin" || user.role === "ca";

  React.useEffect(() => {
    const unsubscribe = subscribeToFixedAssets((data) => {
      setAssets(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = assets.filter((a) => {
    const matchesCategory = categoryFilter === "all" || a.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || a.assetName.toLowerCase().includes(q) || a.vendorName.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const totalCost = filtered.reduce((sum, a) => sum + a.purchaseCost, 0);
  const totalBookValue = filtered.reduce((sum, a) => sum + currentBookValue(a), 0);
  const totalAccumulatedDep = totalCost - totalBookValue;

  const handleDelete = async (asset: FixedAsset) => {
    try {
      await deleteFixedAsset(asset.id, user.uid, user.name);
      toast.success("Asset deleted");
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  const handleExport = () => {
    downloadCsv(
      "fixed-assets-register.csv",
      filtered.map((a) => ({
        "Asset Name": a.assetName,
        Category: a.category,
        "Purchase Date": a.purchaseDate,
        "Purchase Cost": a.purchaseCost,
        Method: DEPRECIATION_METHOD_LABELS[a.depreciationMethod],
        Rate: a.depreciationMethod === "wdv" ? `${a.depreciationRatePercent}%` : `${a.usefulLifeYears}y`,
        "Current Book Value": currentBookValue(a),
        "Accumulated Depreciation": a.purchaseCost - currentBookValue(a),
        Status: a.status,
      }))
    );
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <Landmark className="size-6 text-gold" /> Fixed Assets
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Asset register with automatic WDV/SLM depreciation.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="size-4" /> Export
          </Button>
          {canEdit && (
            <Button
              onClick={() => {
                setEditingAsset(null);
                setFormOpen(true);
              }}
              className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy"
            >
              <Plus className="size-4" /> Add Asset
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
        <p>
          Depreciation rates are working defaults (Income Tax Act WDV block rates) — confirm the correct rate,
          method, and treatment with your CA before filing. This feeds Net Block into the Balance Sheet and a
          Depreciation expense into Profit &amp; Loss automatically.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Cost</p>
          <p className="mt-1 font-heading text-xl font-bold text-foreground">{inr.format(totalCost)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accumulated Depreciation</p>
          <p className="mt-1 font-heading text-xl font-bold text-foreground">{inr.format(totalAccumulatedDep)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Net Block (current)</p>
          <p className="mt-1 font-heading text-xl font-bold text-foreground">{inr.format(totalBookValue)}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or vendor..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as "all" | AssetCategory)}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {ASSET_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left"></th>
                <th className="px-4 py-3 text-left">Asset</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Purchased</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Book Value</th>
                <th className="px-4 py-3 text-left">Status</th>
                {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">No fixed assets yet.</td></tr>
              ) : (
                filtered.map((asset) => {
                  const isExpanded = expandedId === asset.id;
                  const bookValue = currentBookValue(asset);
                  return (
                    <React.Fragment key={asset.id}>
                      <tr className="cursor-pointer hover:bg-muted/30" onClick={() => setExpandedId(isExpanded ? null : asset.id)}>
                        <td className="px-4 py-3 text-muted-foreground">
                          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{asset.assetName}</td>
                        <td className="px-4 py-3"><Badge variant="secondary">{asset.category}</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground">{asset.purchaseDate}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">{inr.format(asset.purchaseCost)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">{inr.format(bookValue)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className={asset.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}>
                            {asset.status === "active" ? "Active" : "Disposed"}
                          </Badge>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <Button size="icon-sm" variant="ghost" onClick={() => { setEditingAsset(asset); setFormOpen(true); }}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button size="icon-sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => setDeletingAsset(asset)}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="bg-muted/20 px-4 py-4">
                            <DepreciationScheduleTable asset={asset} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canEdit && (
        <>
          <FixedAssetFormDialog open={formOpen} onOpenChange={setFormOpen} asset={editingAsset} createdBy={user.uid} />
          <ConfirmDeleteDialog
            open={!!deletingAsset}
            onOpenChange={(open) => !open && setDeletingAsset(null)}
            title={`Delete ${deletingAsset?.assetName}?`}
            description="This removes it from the register and its depreciation schedule. It does not delete any linked expense record."
            onConfirm={() => handleDelete(deletingAsset!)}
          />
        </>
      )}
    </div>
  );
}

function DepreciationScheduleTable({ asset }: { asset: FixedAsset }) {
  const schedule = computeAssetSchedule(asset);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] text-xs">
        <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="py-1.5 text-left">Financial Year</th>
            <th className="py-1.5 text-right">Opening WDV</th>
            <th className="py-1.5 text-right">Depreciation</th>
            <th className="py-1.5 text-right">Closing WDV</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {schedule.map((row) => (
            <tr key={row.fyKey}>
              <td className="py-1.5">FY {row.fyKey}</td>
              <td className="py-1.5 text-right tabular-nums">{inr.format(row.opening)}</td>
              <td className="py-1.5 text-right tabular-nums text-destructive">{inr.format(row.depreciation)}</td>
              <td className="py-1.5 text-right tabular-nums font-medium">{inr.format(row.closing)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
