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
    phone?: string
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

    const sellerId = validItems[0].product.seller_id;
    const allSameSeller = validItems.every((item) => item.product.seller_id === sellerId);
    if (!allSameSeller) throw new AppError("All items must be from the same seller", 400);

    // NOTE: stock is NOT decremented here and the cart is NOT cleared here.
    // Both happen only once payment is CONFIRMED (see fulfillPaidOrder), so an
    // abandoned or failed payment can't silently lose inventory or empty the
    // cart. validItems already checked stock_quantity >= quantity above.
    let totalAmount = 0;
    const orderItems: { product_id: string; quantity: number; unit_price: number; total_price: number }[] = [];

    for (const item of validItems) {
      const itemTotal = item.product.price * item.quantity;
      totalAmount += itemTotal;
      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: itemTotal,
      });
    }

    const deliveryFee = 5;
    totalAmount += deliveryFee;

    const order = (await this.orderRepo.create(
      {
        buyer_id: profileId,
        seller_id: sellerId,
        total_amount: totalAmount,
        delivery_fee: deliveryFee,
        delivery_address: deliveryAddress,
        notes,
        payment_method: paymentMethod,
        status: "pending",
        payment_status: "pending",
      },
      orderItems
    )) as { id: string; seller_id: string; total_amount: number };

    const payment = await this.paymentService.initializePayment({
      amount: totalAmount,
      email,
      profileId,
      orderId: order.id,
      paymentMethod,
      phone,
    });

    return { order, payment };
  }
}
