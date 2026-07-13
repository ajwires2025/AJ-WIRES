import { collection, getDocs } from "firebase/firestore";
import * as XLSX from "xlsx";
import { db } from "@/lib/firebase/client";
import type { Purchase, Sale } from "@/lib/accounts/types";

async function fetchAll<T>(name: string): Promise<T[]> {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

function flattenPurchaseItems(purchases: Purchase[]) {
  return purchases.flatMap((p) =>
    p.items.map((line) => ({
      billNumber: p.billNumber,
      supplierName: p.supplierName,
      ...line,
    }))
  );
}

function flattenSaleItems(sales: Sale[]) {
  return sales.flatMap((s) =>
    s.items.map((line) => ({
      invoiceNumber: s.invoiceNumber,
      customerName: s.customerName,
      ...line,
    }))
  );
}

// A flat, one-file backup of every collection — meant as a safety net /
// hand-off to the CA, not a live sync target. Line items are flattened into
// their own sheets since a spreadsheet can't hold nested arrays.
export async function exportAllDataToExcel(): Promise<void> {
  const [parties, items, purchases, sales, payments, expenses, remindersLog] = await Promise.all([
    fetchAll("parties"),
    fetchAll("items"),
    fetchAll<Purchase>("purchases"),
    fetchAll<Sale>("sales"),
    fetchAll("payments"),
    fetchAll("expenses"),
    fetchAll("remindersLog"),
  ]);

  const purchasesFlat = purchases.map(({ items: _items, ...rest }) => rest);
  const salesFlat = sales.map(({ items: _items, ...rest }) => rest);

  const wb = XLSX.utils.book_new();
  const addSheet = (name: string, rows: unknown[]) => {
    const sheet = XLSX.utils.json_to_sheet(rows.length > 0 ? rows : [{}]);
    XLSX.utils.book_append_sheet(wb, sheet, name);
  };

  addSheet("Parties", parties);
  addSheet("Items", items);
  addSheet("Purchases", purchasesFlat);
  addSheet("Purchase Line Items", flattenPurchaseItems(purchases));
  addSheet("Sales", salesFlat);
  addSheet("Sale Line Items", flattenSaleItems(sales));
  addSheet("Payments", payments);
  addSheet("Expenses & Other Income", expenses);
  addSheet("Reminders Log", remindersLog);

  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `aj-wires-accounts-backup-${dateStamp}.xlsx`);
}
