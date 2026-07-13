import type { Item, Purchase, Sale, CreditNote, DebitNote } from "@/lib/accounts/types";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

export type StockMovementType = "opening" | "purchase" | "sale" | "sales_return" | "purchase_return";

export type StockMovement = {
  date: string;
  type: StockMovementType;
  refNumber: string;
  partyName: string;
  qtyIn: number;
  qtyOut: number;
  rate: number;
  balanceQty: number;
  balanceValue: number;
  avgCost: number;
};

// Weighted-average perpetual inventory: every purchase line (and sales
// return) moves stock in; every sale line (and purchase return) moves stock
// out. Sales returns come back in at the running average cost at that point
// (not the original sale rate) — consistent with weighted-average
// convention, though not a perfect trace back to the exact unit sold.
export function computeItemStockLedger(
  item: Item,
  purchases: Purchase[],
  sales: Sale[],
  creditNotes: CreditNote[] = [],
  debitNotes: DebitNote[] = []
): StockMovement[] {
  const events: { date: string; type: StockMovementType; refNumber: string; partyName: string; qty: number; rate: number }[] = [];

  for (const purchase of purchases) {
    for (const line of purchase.items) {
      if (line.itemId !== item.id) continue;
      events.push({
        date: purchase.billDate,
        type: "purchase",
        refNumber: purchase.billNumber,
        partyName: purchase.supplierName,
        qty: line.quantity,
        rate: line.rate,
      });
    }
  }

  for (const sale of sales) {
    for (const line of sale.items) {
      if (line.itemId !== item.id) continue;
      events.push({
        date: sale.invoiceDate,
        type: "sale",
        refNumber: sale.invoiceNumber,
        partyName: sale.customerName,
        qty: -line.quantity,
        rate: line.rate,
      });
    }
  }

  for (const cn of creditNotes) {
    for (const line of cn.items) {
      if (line.itemId !== item.id) continue;
      events.push({
        date: cn.noteDate,
        type: "sales_return",
        refNumber: cn.noteNumber,
        partyName: cn.customerName,
        qty: line.quantity,
        rate: line.rate,
      });
    }
  }

  for (const dn of debitNotes) {
    for (const line of dn.items) {
      if (line.itemId !== item.id) continue;
      events.push({
        date: dn.noteDate,
        type: "purchase_return",
        refNumber: dn.noteNumber,
        partyName: dn.supplierName,
        qty: -line.quantity,
        rate: line.rate,
      });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date));

  // Items created before opening-stock tracking was added won't have this
  // field in their stored document at all — treat missing as zero.
  const openingStock = item.openingStock ?? 0;
  const defaultCostPrice = item.defaultCostPrice ?? 0;

  const movements: StockMovement[] = [];
  let balanceQty = openingStock;
  let balanceValue = round2(openingStock * defaultCostPrice);

  movements.push({
    date: "—",
    type: "opening",
    refNumber: "Opening balance",
    partyName: "",
    qtyIn: openingStock,
    qtyOut: 0,
    rate: defaultCostPrice,
    balanceQty,
    balanceValue,
    avgCost: balanceQty > 0 ? round2(balanceValue / balanceQty) : 0,
  });

  for (const event of events) {
    const avgCostBefore = balanceQty > 0 ? balanceValue / balanceQty : 0;

    if (event.type === "sales_return") {
      // Comes back in at the running average cost, not the original sale rate.
      balanceValue = round2(balanceValue + event.qty * avgCostBefore);
      balanceQty = round3(balanceQty + event.qty);
    } else if (event.qty >= 0) {
      balanceValue = round2(balanceValue + event.qty * event.rate);
      balanceQty = round3(balanceQty + event.qty);
    } else {
      const qtyOut = -event.qty;
      const valueOut = round2(avgCostBefore * qtyOut);
      balanceValue = round2(balanceValue - valueOut);
      balanceQty = round3(balanceQty - qtyOut);
    }

    movements.push({
      date: event.date,
      type: event.type,
      refNumber: event.refNumber,
      partyName: event.partyName,
      qtyIn: event.qty >= 0 ? event.qty : 0,
      qtyOut: event.qty < 0 ? -event.qty : 0,
      rate: event.rate,
      balanceQty,
      balanceValue,
      avgCost: balanceQty > 0 ? round2(balanceValue / balanceQty) : 0,
    });
  }

  return movements;
}

export type StockSummaryRow = {
  itemId: string;
  itemName: string;
  unit: string;
  openingStock: number;
  totalIn: number;
  totalOut: number;
  closingQty: number;
  avgCost: number;
  closingValue: number;
};

export function computeStockSummary(
  items: Item[],
  purchases: Purchase[],
  sales: Sale[],
  creditNotes: CreditNote[] = [],
  debitNotes: DebitNote[] = []
): StockSummaryRow[] {
  return items.map((item) => {
    const ledger = computeItemStockLedger(item, purchases, sales, creditNotes, debitNotes);
    const last = ledger[ledger.length - 1];
    const totalIn = ledger.reduce((sum, m) => sum + (m.type === "purchase" || m.type === "sales_return" ? m.qtyIn : 0), 0);
    const totalOut = ledger.reduce((sum, m) => sum + (m.type === "sale" || m.type === "purchase_return" ? m.qtyOut : 0), 0);

    return {
      itemId: item.id,
      itemName: item.name,
      unit: item.unit,
      openingStock: item.openingStock ?? 0,
      totalIn: round3(totalIn),
      totalOut: round3(totalOut),
      closingQty: last.balanceQty,
      avgCost: last.avgCost,
      closingValue: last.balanceValue,
    };
  });
}
