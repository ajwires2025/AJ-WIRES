import type { Item, Purchase, Sale } from "@/lib/accounts/types";

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

export type StockMovementType = "opening" | "purchase" | "sale";

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

// Weighted-average perpetual inventory: every purchase line moves stock in
// at its rate; every sale line moves stock out valued at the running
// average cost (not the sale rate) so margin/COGS stay consistent with the
// sales module. Opening stock is valued at the item's current cost price.
export function computeItemStockLedger(item: Item, purchases: Purchase[], sales: Sale[]): StockMovement[] {
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

  events.sort((a, b) => a.date.localeCompare(b.date));

  const movements: StockMovement[] = [];
  let balanceQty = item.openingStock;
  let balanceValue = round2(item.openingStock * item.defaultCostPrice);

  movements.push({
    date: "—",
    type: "opening",
    refNumber: "Opening balance",
    partyName: "",
    qtyIn: item.openingStock,
    qtyOut: 0,
    rate: item.defaultCostPrice,
    balanceQty,
    balanceValue,
    avgCost: balanceQty > 0 ? round2(balanceValue / balanceQty) : 0,
  });

  for (const event of events) {
    const avgCostBefore = balanceQty > 0 ? balanceValue / balanceQty : 0;

    if (event.qty >= 0) {
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

export function computeStockSummary(items: Item[], purchases: Purchase[], sales: Sale[]): StockSummaryRow[] {
  return items.map((item) => {
    const ledger = computeItemStockLedger(item, purchases, sales);
    const last = ledger[ledger.length - 1];
    const totalIn = ledger.reduce((sum, m) => sum + (m.type === "purchase" ? m.qtyIn : 0), 0);
    const totalOut = ledger.reduce((sum, m) => sum + (m.type === "sale" ? m.qtyOut : 0), 0);

    return {
      itemId: item.id,
      itemName: item.name,
      unit: item.unit,
      openingStock: item.openingStock,
      totalIn: round3(totalIn),
      totalOut: round3(totalOut),
      closingQty: last.balanceQty,
      avgCost: last.avgCost,
      closingValue: last.balanceValue,
    };
  });
}
