import { describe, it, expect } from "vitest";
import { createProductSchema } from "@/lib/validators/product";
import { createTaskSchema } from "@/lib/validators/task";
import { createRideSchema } from "@/lib/validators/ride";
import { initializePaymentSchema } from "@/lib/validators/payment";

describe("Validators", () => {
  it("validates product creation", () => {
    const result = createProductSchema.safeParse({
      title: "Test Product",
      price: 50,
      condition: "new",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid product price", () => {
    const result = createProductSchema.safeParse({ title: "Test", price: -5 });
    expect(result.success).toBe(false);
  });

  it("validates task creation", () => {
    const result = createTaskSchema.safeParse({
      title: "Help with assignment",
      description: "Need help with calculus homework",
      category: "academic",
      reward: 20,
      deadline: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it("validates ride creation", () => {
    const result = createRideSchema.safeParse({
      pickupAddress: "UCC Main Gate",
      pickupLat: 5.1053,
      pickupLng: -1.2466,
      destinationAddress: "Kotokuraba",
      destinationLat: 5.11,
      destinationLng: -1.25,
      distanceKm: 3.5,
      durationMinutes: 10,
    });
    expect(result.success).toBe(true);
  });

  it("validates payment initialization", () => {
    const result = initializePaymentSchema.safeParse({
      amount: 100,
      email: "test@ucc.edu.gh",
    });
    expect(result.success).toBe(true);
  });
});
