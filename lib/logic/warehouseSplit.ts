import { QuoteLine, Warehouse, WarehouseSplitPlan, WarehouseSplitLine, Product } from "../types";

/**
 * Greedy split algorithm:
 *  1. For each product line, try to fulfill fully from a single warehouse
 *     (preferring the lowest shippingCostWeight) to minimize shipment count.
 *  2. If no single warehouse has enough stock, split across warehouses,
 *     consuming from cheapest-to-ship first.
 *  3. Anything still unmet becomes a backorder line.
 *
 * Only physical Hardware lines are warehouse-fulfilled. Services are
 * engagements and Subscriptions are billed on a schedule — neither ships
 * from a warehouse.
 */
export function computeWarehouseSplit(
  lines: QuoteLine[],
  warehouses: Warehouse[],
  products: Product[]
): WarehouseSplitPlan {
  const sortedWarehouses = [...warehouses].sort((a, b) => a.shippingCostWeight - b.shippingCostWeight);
  const splitLines: WarehouseSplitLine[] = [];
  const backorderLines: { productId: string; quantity: number }[] = [];
  // local copy of stock so we don't mutate the source
  const stockCopy: Record<string, Record<string, number>> = {};
  for (const w of sortedWarehouses) stockCopy[w.id] = { ...w.stock };

  const fulfillableLines = lines.filter((l) => {
    if (l.isRecurring) return false;
    const product = products.find((p) => p.id === l.productId);
    return product?.category === "Hardware";
  });

  for (const line of fulfillableLines) {
    let remaining = line.quantity;

    // Step 1: try a single warehouse that can cover it fully
    const singleFit = sortedWarehouses.find(
      (w) => (stockCopy[w.id][line.productId] ?? 0) >= remaining
    );
    if (singleFit) {
      stockCopy[singleFit.id][line.productId] -= remaining;
      splitLines.push({ warehouseId: singleFit.id, productId: line.productId, quantity: remaining });
      continue;
    }

    // Step 2: split across warehouses, cheapest shipping first
    for (const w of sortedWarehouses) {
      if (remaining <= 0) break;
      const available = stockCopy[w.id][line.productId] ?? 0;
      if (available <= 0) continue;
      const take = Math.min(available, remaining);
      stockCopy[w.id][line.productId] -= take;
      splitLines.push({ warehouseId: w.id, productId: line.productId, quantity: take });
      remaining -= take;
    }

    // Step 3: whatever's left is backordered
    if (remaining > 0) {
      backorderLines.push({ productId: line.productId, quantity: remaining });
    }
  }

  const shipmentCount = new Set(splitLines.map((l) => l.warehouseId)).size;
  const estimatedShippingCost = splitLines.reduce((sum, l) => {
    const w = warehouses.find((wh) => wh.id === l.warehouseId);
    return sum + (w ? w.shippingCostWeight * Math.ceil(l.quantity / 5) : 0);
  }, 0);

  return {
    lines: splitLines,
    shipmentCount: Math.max(shipmentCount, splitLines.length > 0 ? shipmentCount : 0),
    estimatedShippingCost: Math.round(estimatedShippingCost * 100) / 100,
    backorderLines,
    isManualOverride: false,
  };
}

/**
 * When backordered stock later arrives, propose consolidating the
 * remaining backorder into the fewest additional shipments possible.
 */
export function consolidateBackorder(
  backorder: { productId: string; quantity: number }[],
  warehouses: Warehouse[]
): WarehouseSplitLine[] {
  const sorted = [...warehouses].sort((a, b) => a.shippingCostWeight - b.shippingCostWeight);
  const result: WarehouseSplitLine[] = [];
  for (const item of backorder) {
    let remaining = item.quantity;
    for (const w of sorted) {
      if (remaining <= 0) break;
      const avail = w.stock[item.productId] ?? 0;
      if (avail <= 0) continue;
      const take = Math.min(avail, remaining);
      result.push({ warehouseId: w.id, productId: item.productId, quantity: take });
      remaining -= take;
    }
  }
  return result;
}
