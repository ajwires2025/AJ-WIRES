"use client";

import * as React from "react";
import { Plus, Search, Pencil, Trash2, Package, TriangleAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem as SelectOption,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemFormDialog } from "@/components/accounts/item-form-dialog";
import { ConfirmDeleteDialog } from "@/components/accounts/confirm-delete-dialog";
import { subscribeToItems, deleteItem, seedDefaultItems } from "@/lib/accounts/items";
import { ITEM_CATEGORY_LABELS, UNIT_LABELS, type Item, type ItemCategory } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function ItemsClient({ user }: { user: SessionUser }) {
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<"all" | ItemCategory>("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<Item | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<Item | null>(null);
  const [seeding, setSeeding] = React.useState(false);

  // Both Admin and CA have full edit access.
  const canEdit = user.role === "admin" || user.role === "ca";

  React.useEffect(() => {
    const unsubscribe = subscribeToItems((data) => {
      setItems(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = items.filter((i) => {
    const matchesCategory = categoryFilter === "all" || i.category === categoryFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || i.name.toLowerCase().includes(q) || i.hsnCode.includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleDelete = async (item: Item) => {
    try {
      await deleteItem(item.id);
      toast.success("Item deleted");
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      await seedDefaultItems(user.uid);
      toast.success("Default items added — verify HSN codes and GST rates with your CA.");
    } catch {
      toast.error("Couldn't add defaults. Try again.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <Package className="size-6 text-gold" /> Items
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Product catalog with HSN codes and pricing.</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {items.length === 0 && !loading && (
              <Button variant="outline" onClick={handleSeedDefaults} disabled={seeding}>
                <Sparkles className="size-4" /> Add default items
              </Button>
            )}
            <Button
              onClick={() => {
                setEditingItem(null);
                setFormOpen(true);
              }}
              className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy"
            >
              <Plus className="size-4" /> Add Item
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        <p>
          HSN codes and GST rates shown are working defaults, not final. Confirm the correct HSN
          digit-length and rate for each item with your CA before filing.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or HSN code..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as "all" | ItemCategory)}>
          <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectOption value="all">All categories</SelectOption>
            {Object.entries(ITEM_CATEGORY_LABELS).map(([value, label]) => (
              <SelectOption key={value} value={value}>{label}</SelectOption>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">HSN</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-right">Cost price</th>
                <th className="px-4 py-3 text-right">Sale price</th>
                <th className="px-4 py-3 text-right">GST %</th>
                {canEdit && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No items found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{item.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{ITEM_CATEGORY_LABELS[item.category]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.hsnCode}</td>
                    <td className="px-4 py-3 text-muted-foreground">{UNIT_LABELS[item.unit]}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {inr.format(item.defaultCostPrice || 0)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {inr.format(item.defaultSalePrice || 0)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{item.gstRate}%</td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingItem(item);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingItem(item)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canEdit && (
        <>
          <ItemFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            item={editingItem}
            createdBy={user.uid}
          />
          <ConfirmDeleteDialog
            open={!!deletingItem}
            onOpenChange={(open) => !open && setDeletingItem(null)}
            title={`Delete ${deletingItem?.name}?`}
            description="This can't be undone. Bills that already reference this item keep their historical data."
            onConfirm={() => handleDelete(deletingItem!)}
          />
        </>
      )}
    </div>
  );
}
