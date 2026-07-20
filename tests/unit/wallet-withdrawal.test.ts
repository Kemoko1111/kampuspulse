import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PaymentService } from "@/lib/services/payment.service";

function mockSupabase(overrides: { decrementOk?: boolean } = {}) {
  const inserted: Record<string, unknown>[] = [];
  const rpcCalls: { name: string; args: unknown }[] = [];

  return {
    inserted,
    rpcCalls,
    client: {
      rpc: vi.fn((name: string, args: unknown) => {
        rpcCalls.push({ name, args });
        if (name === "decrement_wallet_balance") {
          return Promise.resolve({ data: overrides.decrementOk ?? true, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
      from: vi.fn(() => ({
        insert: vi.fn((row: Record<string, unknown>) => {
          inserted.push(row);
          return Promise.resolve({ data: null, error: null });
        }),
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  };
}

describe("PaymentService.initiateWithdrawal", () => {
  const originalFetch = global.fetch;
  const originalSecret = process.env.PAYSTACK_SECRET_KEY;

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.PAYSTACK_SECRET_KEY = originalSecret;
  });

  it("rejects withdrawal when the wallet balance is insufficient, without touching Paystack", async () => {
    const { client, rpcCalls } = mockSupabase({ decrementOk: false });
    const service = new PaymentService(client);

    await expect(
      service.initiateWithdrawal("profile-1", 999, "0241234567", "mtn_momo")
    ).rejects.toThrow("Insufficient wallet balance");

    expect(rpcCalls.some((c) => c.name === "increment_wallet_balance")).toBe(false);
  });

  it("dev mode (Paystack not configured): debits once and records success, no network call", async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const { client, inserted, rpcCalls } = mockSupabase({ decrementOk: true });
    const service = new PaymentService(client);

    const result = await service.initiateWithdrawal("profile-1", 50, "0241234567", "mtn_momo");

    expect(result.status).toBe("success");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ status: "success", type: "withdrawal", amount: 50 });
    expect(rpcCalls.filter((c) => c.name === "decrement_wallet_balance")).toHaveLength(1);
  });

  it("compensates (credits the wallet back) when the Paystack transfer call fails", async () => {
    process.env.PAYSTACK_SECRET_KEY = "sk_test_real_looking_key";

    let call = 0;
    global.fetch = vi.fn(() => {
      call++;
      if (call === 1) {
        // transferrecipient succeeds
        return Promise.resolve({
          json: () => Promise.resolve({ status: true, data: { recipient_code: "RCP_xyz" } }),
        } as Response);
      }
      // transfer itself fails
      return Promise.resolve({
        json: () => Promise.resolve({ status: false, message: "Insufficient Paystack balance" }),
      } as Response);
    }) as unknown as typeof fetch;

    const { client, inserted, rpcCalls } = mockSupabase({ decrementOk: true });
    const service = new PaymentService(client);

    await expect(
      service.initiateWithdrawal("profile-1", 75, "0241234567", "mtn_momo")
    ).rejects.toThrow("Insufficient Paystack balance");

    // Debited once, then credited back once — net zero, not a silent loss.
    const decrementCalls = rpcCalls.filter((c) => c.name === "decrement_wallet_balance");
    const incrementCalls = rpcCalls.filter((c) => c.name === "increment_wallet_balance") as {
      name: string;
      args: { p_user_id: string; p_amount: number };
    }[];
    expect(decrementCalls).toHaveLength(1);
    expect(incrementCalls).toHaveLength(1);
    expect(incrementCalls[0].args.p_amount).toBe(75);

    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ status: "failed", type: "withdrawal" });
  });
});
