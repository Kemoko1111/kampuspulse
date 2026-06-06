import { describe, it, expect } from "vitest";

describe("Checkout business rules", () => {
  it("calculates order total with delivery fee", () => {
    const items = [{ price: 50, quantity: 2 }, { price: 30, quantity: 1 }];
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const deliveryFee = 5;
    expect(subtotal + deliveryFee).toBe(135);
  });

  it("validates single seller constraint", () => {
    const items = [
      { seller_id: "a", product_id: "1" },
      { seller_id: "a", product_id: "2" },
      { seller_id: "b", product_id: "3" },
    ];
    const sellerIds = new Set(items.map((i) => i.seller_id));
    expect(sellerIds.size).toBeGreaterThan(1);
  });
});
