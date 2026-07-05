import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { AppError } from "@/lib/errors/app-error";
import { CartRepository } from "@/lib/repositories/cart.repository";
import { OrderRepository } from "@/lib/repositories/order.repository";
import { PaymentService } from "@/lib/services/payment.service";

export class CheckoutService {
  private cartRepo: CartRepository;
  private orderRepo: OrderRepository;
  private paymentService: PaymentService;

  constructor(private supabase: TypedSupabaseClient) {
    this.cartRepo = new CartRepository(supabase);
    this.orderRepo = new OrderRepository(supabase);
    this.paymentService = new PaymentService(supabase);
  }

  async createOrderFromCart(
    profileId: string,
    email: string,
    deliveryAddress: string,
    notes?: string,
    paymentMethod = "mtn_momo",
    phone?: string,
    promoCode?: string
  ) {
    const { data: rawCartItems, error: cartError } = await this.cartRepo.findByUser(profileId);
    if (cartError) throw cartError;

    type CartItemWithProduct = {
      product_id: string;
      quantity: number;
      product: { title: string; price: number; seller_id: string; status: string; stock_quantity: number };
    };
    const cartItems = (rawCartItems || []) as CartItemWithProduct[];
    if (!cartItems.length) throw new AppError("Cart is empty", 400);

    const validItems = cartItems.filter(
      (item) => item.product && item.product.status === "active" && item.product.stock_quantity >= item.quantity
    );

    if (!validItems.length) throw new AppError("No valid items in cart", 400);

    // NOTE: stock is NOT decremented here and the cart is NOT cleared here.
    // Both happen only once payment is CONFIRMED (see fulfillPaidOrder), so an
    // abandoned or failed payment can't silently lose inventory or empty the
    // cart. validItems already checked stock_quantity >= quantity above.
    //
    // A cart can contain items from multiple sellers — create ONE order per
    // seller (each is fulfilled/delivered independently) and settle them all
    // with a single payment. Previously a mixed cart just errored and could
    // never check out.
    const bySeller = new Map<string, typeof validItems>();
    for (const item of validItems) {
      const sid = item.product.seller_id;
      if (!bySeller.has(sid)) bySeller.set(sid, []);
      bySeller.get(sid)!.push(item);
    }

    const deliveryFee = 5;
    let grandTotal = 0;
    const orders: { id: string; seller_id: string; total_amount: number }[] = [];

    for (const [sellerId, items] of bySeller) {
      let sellerSubtotal = 0;
      const orderItems = items.map((item) => {
        const itemTotal = item.product.price * item.quantity;
        sellerSubtotal += itemTotal;
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: itemTotal,
        };
      });
      const orderTotal = sellerSubtotal + deliveryFee;
      grandTotal += orderTotal;

      const order = (await this.orderRepo.create(
        {
          buyer_id: profileId,
          seller_id: sellerId,
          total_amount: orderTotal,
          delivery_fee: deliveryFee,
          delivery_address: deliveryAddress,
          notes,
          payment_method: paymentMethod,
          status: "pending",
          payment_status: "pending",
        },
        orderItems
      )) as { id: string; seller_id: string; total_amount: number };
      orders.push(order);
    }

    // Apply a promo code to the amount actually charged (previously the cart
    // showed a discount but checkout charged full price). The discount reduces
    // the payment; per-order face values are unchanged.
    const discount = promoCode ? await this.applyPromo(promoCode, grandTotal) : 0;
    const payableAmount = Math.max(0, Math.round((grandTotal - discount) * 100) / 100);

    const payment = await this.paymentService.initializePayment({
      amount: payableAmount,
      email,
      profileId,
      orderId: orders[0].id,
      orderIds: orders.map((o) => o.id),
      paymentMethod,
      phone,
    });

    return { order: orders[0], orders, payment, discount };
  }

  // Validates a promo code against the same rules as /api/promotions/validate,
  // returns the discount amount, and consumes one use. Throws if the code
  // doesn't apply, so the buyer isn't silently charged full price. Uses
  // this.supabase (the service-role client from the orders route) to read/
  // update the RLS-protected promotions table.
  private async applyPromo(code: string, orderAmount: number): Promise<number> {
    const { data } = await this.supabase
      .from("promotions")
      .select("*")
      .eq("code", code.toUpperCase())
      .maybeSingle();
    const promo = data as {
      id: string; discount_type: "percentage" | "fixed"; discount_value: number;
      min_order_amount: number; max_uses: number | null; current_uses: number;
      expires_at: string | null; status: string;
    } | null;

    if (!promo) throw new AppError("Promo code not found", 400);
    if (promo.status !== "active") throw new AppError(`This promo code is ${promo.status}`, 400);
    if (promo.expires_at && new Date(promo.expires_at) <= new Date()) throw new AppError("This promo code has expired", 400);
    if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) throw new AppError("This promo code has reached its usage limit", 400);
    if (orderAmount < promo.min_order_amount) throw new AppError(`This code requires a minimum order of GHS ${promo.min_order_amount}`, 400);

    const discount = promo.discount_type === "percentage"
      ? Math.round(orderAmount * (promo.discount_value / 100) * 100) / 100
      : promo.discount_value;

    await this.supabase
      .from("promotions")
      .update({ current_uses: promo.current_uses + 1 } as never)
      .eq("id", promo.id);

    return Math.min(discount, orderAmount);
  }
}
