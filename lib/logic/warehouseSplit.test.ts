import { describe, it, expect } from "vitest";
import { computeWarehouseSplit, consolidateBackorder } from "./warehouseSplit";
import { Warehouse, Product, QuoteLine } from "../types";

describe("warehouseSplit engine", () => {
  const warehouses: Warehouse[] = [
    {
      id: "wh-main",
      name: "Main Warehouse",
      location: "Newark, NJ",
      shippingCostWeight: 1.0,
      replenishmentDays: 5,
      stock: { "prod-laptop": 10, "prod-monitor": 4 },
    },
    {
      id: "wh-east",
      name: "East Depot",
      location: "Columbus, OH",
      shippingCostWeight: 1.4,
      replenishmentDays: 3,
      stock: { "prod-laptop": 5, "prod-monitor": 15 },
    },
  ];

  const products: Product[] = [
    { id: "prod-laptop", name: "Laptop", category: "Hardware", basePrice: 1000, unit: "unit", tax: 0, description: "", variants: [], marginPercent: 20, isRecurring: false },
    { id: "prod-monitor", name: "Monitor", category: "Hardware", basePrice: 300, unit: "unit", tax: 0, description: "", variants: [], marginPercent: 25, isRecurring: false },
    { id: "prod-service", name: "Setup Service", category: "Services", basePrice: 500, unit: "engagement", tax: 0, description: "", variants: [], marginPercent: 40, isRecurring: false },
    { id: "prod-sub", name: "Support Plan", category: "Subscriptions", basePrice: 100, unit: "month", tax: 0, description: "", variants: [], marginPercent: 50, isRecurring: true },
  ];

  it("fulfills fully from single cheapest warehouse when it covers full demand", () => {
    // 5 laptops: Newark has 10 (cheaper weight 1.0). Should fulfill fully from wh-main.
    const lines: QuoteLine[] = [
      { id: "l1", productId: "prod-laptop", quantity: 5, listPrice: 1000, discountPercent: 0, categoryCeiling: 15, overPoints: 0, isRecurring: false },
    ];
    const plan = computeWarehouseSplit(lines, warehouses, products);

    expect(plan.lines).toHaveLength(1);
    expect(plan.lines[0].warehouseId).toBe("wh-main");
    expect(plan.lines[0].quantity).toBe(5);
    expect(plan.backorderLines).toHaveLength(0);
    expect(plan.shipmentCount).toBe(1);
  });

  it("picks the single warehouse that covers demand even if it has higher shipping weight", () => {
    // 8 monitors: Newark only has 4, East has 15. East can fulfill in 1 shipment, Newark cannot.
    const lines: QuoteLine[] = [
      { id: "l1", productId: "prod-monitor", quantity: 8, listPrice: 300, discountPercent: 0, categoryCeiling: 15, overPoints: 0, isRecurring: false },
    ];
    const plan = computeWarehouseSplit(lines, warehouses, products);

    expect(plan.lines).toHaveLength(1);
    expect(plan.lines[0].warehouseId).toBe("wh-east");
    expect(plan.lines[0].quantity).toBe(8);
    expect(plan.backorderLines).toHaveLength(0);
  });

  it("splits across warehouses when neither single warehouse has enough stock", () => {
    // 12 laptops: Newark has 10, East has 5. Newark gives 10, East gives 2.
    const lines: QuoteLine[] = [
      { id: "l1", productId: "prod-laptop", quantity: 12, listPrice: 1000, discountPercent: 0, categoryCeiling: 15, overPoints: 0, isRecurring: false },
    ];
    const plan = computeWarehouseSplit(lines, warehouses, products);

    expect(plan.lines).toHaveLength(2);
    expect(plan.lines[0]).toEqual({ warehouseId: "wh-main", productId: "prod-laptop", quantity: 10 });
    expect(plan.lines[1]).toEqual({ warehouseId: "wh-east", productId: "prod-laptop", quantity: 2 });
    expect(plan.backorderLines).toHaveLength(0);
    expect(plan.shipmentCount).toBe(2);
  });

  it("generates backorder lines when total stock across all warehouses is insufficient", () => {
    // 18 laptops: Newark has 10, East has 5 -> total 15. 3 must be backordered.
    const lines: QuoteLine[] = [
      { id: "l1", productId: "prod-laptop", quantity: 18, listPrice: 1000, discountPercent: 0, categoryCeiling: 15, overPoints: 0, isRecurring: false },
    ];
    const plan = computeWarehouseSplit(lines, warehouses, products);

    expect(plan.lines).toHaveLength(2);
    expect(plan.lines[0].quantity).toBe(10);
    expect(plan.lines[1].quantity).toBe(5);
    expect(plan.backorderLines).toHaveLength(1);
    expect(plan.backorderLines[0]).toEqual({ productId: "prod-laptop", quantity: 3 });
  });

  it("excludes non-hardware products (Services and Subscriptions) from fulfillment", () => {
    const lines: QuoteLine[] = [
      { id: "l1", productId: "prod-service", quantity: 2, listPrice: 500, discountPercent: 0, categoryCeiling: 10, overPoints: 0, isRecurring: false },
      { id: "l2", productId: "prod-sub", quantity: 5, listPrice: 100, discountPercent: 0, categoryCeiling: 12, overPoints: 0, isRecurring: true },
    ];
    const plan = computeWarehouseSplit(lines, warehouses, products);

    expect(plan.lines).toHaveLength(0);
    expect(plan.backorderLines).toHaveLength(0);
    expect(plan.shipmentCount).toBe(0);
  });

  describe("consolidateBackorder", () => {
    it("consolidates backordered items into available warehouse inventory", () => {
      const restockedWarehouses: Warehouse[] = [
        {
          id: "wh-main",
          name: "Main",
          location: "NJ",
          shippingCostWeight: 1.0,
          replenishmentDays: 5,
          stock: { "prod-laptop": 5 },
        },
      ];
      const backorder = [{ productId: "prod-laptop", quantity: 3 }];
      const consolidated = consolidateBackorder(backorder, restockedWarehouses);

      expect(consolidated).toHaveLength(1);
      expect(consolidated[0]).toEqual({ warehouseId: "wh-main", productId: "prod-laptop", quantity: 3 });
    });
  });
});
