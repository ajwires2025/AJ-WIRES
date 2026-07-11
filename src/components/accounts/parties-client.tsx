"use client";

import * as React from "react";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
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
import { PartyFormDialog } from "@/components/accounts/party-form-dialog";
import { ConfirmDeleteDialog } from "@/components/accounts/confirm-delete-dialog";
import { subscribeToParties, deleteParty } from "@/lib/accounts/parties";
import type { Party, PartyType } from "@/lib/accounts/types";
import type { SessionUser } from "@/lib/firebase/session";

const TYPE_BADGE: Record<PartyType, string> = {
  customer: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  supplier: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  both: "bg-gold/15 text-gold-light dark:text-gold",
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function PartiesClient({ user }: { user: SessionUser }) {
  const [parties, setParties] = React.useState<Party[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | PartyType>("all");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingParty, setEditingParty] = React.useState<Party | null>(null);
  const [deletingParty, setDeletingParty] = React.useState<Party | null>(null);

  const isAdmin = user.role === "admin";

  React.useEffect(() => {
    const unsubscribe = subscribeToParties((data) => {
      setParties(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filtered = parties.filter((p) => {
    const matchesType = typeFilter === "all" || p.type === typeFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.gstin.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q) ||
      p.contactPerson.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const handleDelete = async (party: Party) => {
    try {
      await deleteParty(party.id);
      toast.success("Party deleted");
    } catch {
      toast.error("Couldn't delete. Try again.");
    }
  };

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-foreground">
            <Users className="size-6 text-gold" /> Parties
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Customers and suppliers.</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditingParty(null);
              setFormOpen(true);
            }}
            className="bg-navy text-white hover:bg-navy-light dark:bg-gold dark:text-navy"
          >
            <Plus className="size-4" /> Add Party
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, GSTIN, phone, contact..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | PartyType)}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="supplier">Supplier</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">State</th>
                <th className="px-4 py-3 text-left">GSTIN</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-right">Opening balance</th>
                {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                    No parties found.
                  </td>
                </tr>
              ) : (
                filtered.map((party) => (
                  <tr key={party.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{party.name}</td>
                    <td className="px-4 py-3">
                      <Badge className={TYPE_BADGE[party.type]} variant="secondary">
                        {party.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {party.state} ({party.stateCode})
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{party.gstin || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {party.contactPerson || party.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {inr.format(party.openingBalance || 0)}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingParty(party);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingParty(party)}
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

      {isAdmin && (
        <>
          <PartyFormDialog
            open={formOpen}
            onOpenChange={setFormOpen}
            party={editingParty}
            createdBy={user.uid}
          />
          <ConfirmDeleteDialog
            open={!!deletingParty}
            onOpenChange={(open) => !open && setDeletingParty(null)}
            title={`Delete ${deletingParty?.name}?`}
            description="This can't be undone. Any bills already linked to this party will keep their historical data."
            onConfirm={() => handleDelete(deletingParty!)}
          />
        </>
      )}
    </div>
  );
}
