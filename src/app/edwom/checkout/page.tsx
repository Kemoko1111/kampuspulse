"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle, MapPin, Phone,
  CreditCard, Lock, ChevronRight, Smartphone,
  Loader2, Package,
} from "lucide-react";
import { Sidebar, MobileNav, TopBar } from "@/components/layout/navigation";
import { useCart } from "@/hooks/useCart";
import { apiFetch } from "@/lib/api-client";

const paymentMethods = [
  { id: "mtn", label: "MTN Mobile Money", apiId: "mtn_momo", emoji: "📱", color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10", placeholder: "024X XXX XXX" },
  { id: "telecel", label: "Telecel Cash", apiId: "telecel", emoji: "💳", color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10", placeholder: "020X XXX XXX" },
  { id: "airteltigo", label: "AirtelTigo Money", apiId: "airteltigo", emoji: "💰", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10", placeholder: "027X XXX XXX" },
];

const steps = ["Delivery", "Payment", "Review"];

interface CartProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
}

interface CartItemRow {
  product_id: string;
  quantity: number;
  product: CartProduct;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, loading, total } = useCart();
  const cartItems = items as CartItemRow[];

  const [step, setStep] = useState(0);
  const [payMethod, setPayMethod] = useState("mtn");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [hall, setHall] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delivery = 5;
  const orderTotal = total + delivery;

  const devPayments =
    !process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.includes("placeholder");

  const handlePay = async () => {
    setProcessing(true);
    setError(null);

    const deliveryAddress = [hall, address, `Phone: ${phone}`].filter(Boolean).join(", ");
    const selectedMethod = paymentMethods.find(p => p.id === payMethod);

    try {
      const res = await apiFetch("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          deliveryAddress,
          paymentMethod: selectedMethod?.apiId || "mtn_momo",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create order");
      }

      const { data } = await res.json();

      if (data?.payment?.dev_mode) {
        router.push(data.payment.redirect_url || "/edwom/orders");
        return;
      }

      const authUrl = data?.payment?.authorization_url;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        throw new Error("Payment URL not received");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <TopBar title="Checkout" />
        <main className="lg:pl-64 pb-20 lg:pb-0 min-h-screen flex flex-col items-center justify-center px-4">
          <Package className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Link href="/edwom/cart" className="btn-primary px-6 py-2.5 text-sm">Back to Cart</Link>
        </main>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar title="Checkout" />
      <main className="lg:pl-64 pb-20 lg:pb-0 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <Link href="/edwom/cart" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Cart
          </Link>

          {devPayments && (
            <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm">
              Dev mode: payments complete instantly without Paystack.
            </div>
          )}

          <div className="flex items-center mb-8 gap-1">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex flex-col items-center gap-1 flex-shrink-0 ${i <= step ? "" : "opacity-40"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                    ${i < step ? "bg-blue-500 border-blue-500 text-white" : i === step ? "border-blue-500 text-blue-400 bg-blue-500/10" : "border-white/20 text-muted-foreground"}`}>
                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] hidden sm:block font-medium ${i === step ? "text-blue-400" : "text-muted-foreground"}`}>{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-2 transition-all ${i < step ? "bg-blue-500" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {step === 0 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 space-y-4">
                  <h2 className="font-display font-bold text-xl flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-400" /> Delivery Details
                  </h2>
                  <div>
                    <label className="text-sm font-medium block mb-2">Hall of Residence / Location *</label>
                    <select id="checkout-hall" value={hall} onChange={e => setHall(e.target.value)} className="input-premium">
                      <option value="">Select your hall...</option>
                      {["Atlantic Hall", "Casely Hayford Hall", "Adehye Hall", "Valco Hall", "Kwame Nkrumah Hall", "Off Campus / Other"].map(h => (
                        <option key={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">Specific Address / Room Number</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input id="checkout-address" type="text" value={address} onChange={e => setAddress(e.target.value)}
                        placeholder="e.g. Room 204, Block B" className="input-premium pl-9" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-2">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input id="checkout-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="0244 123 456" className="input-premium pl-9" />
                    </div>
                  </div>
                  <button id="checkout-next-0" onClick={() => setStep(1)} disabled={!hall || !phone}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                    Continue to Payment <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 space-y-4">
                  <h2 className="font-display font-bold text-xl flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-400" /> Payment Method
                  </h2>
                  <p className="text-sm text-muted-foreground">Choose your preferred mobile money provider</p>
                  <div className="space-y-3">
                    {paymentMethods.map(({ id, label, emoji, color, border, bg, placeholder }) => (
                      <button key={id} id={`pay-${id}`} onClick={() => setPayMethod(id)}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all
                          ${payMethod === id ? `${bg} ${border}` : "glass border-white/10 hover:border-white/20"}`}>
                        <span className="text-2xl">{emoji}</span>
                        <div className="flex-1">
                          <div className={`font-semibold text-sm ${payMethod === id ? color : "text-foreground"}`}>{label}</div>
                          <div className="text-xs text-muted-foreground">Powered by Paystack</div>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${payMethod === id ? "border-blue-400 bg-blue-400" : "border-white/30"}`}>
                          {payMethod === id && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                  {payMethod && (
                    <div>
                      <label className="text-sm font-medium block mb-2">
                        {paymentMethods.find(p => p.id === payMethod)?.label} Number
                      </label>
                      <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input id="momo-number" type="tel"
                          placeholder={paymentMethods.find(p => p.id === payMethod)?.placeholder}
                          className="input-premium pl-9" />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={() => setStep(0)} className="flex-1 glass border border-white/10 rounded-xl py-3 text-sm font-medium hover:bg-white/5 transition-all">
                      Back
                    </button>
                    <button id="checkout-next-1" onClick={() => setStep(2)} className="flex-[2] btn-primary flex items-center justify-center gap-2 py-3">
                      Review Order <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 space-y-5">
                  <h2 className="font-display font-bold text-xl">Review & Confirm</h2>
                  <div className="space-y-2">
                    {cartItems.map(item => (
                      <div key={item.product_id} className="flex items-center gap-3 p-3 glass border border-white/10 rounded-xl">
                        {item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground/30" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product?.title}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-bold text-sm text-blue-400">GHS {(item.product?.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="glass border border-white/10 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Delivering to</span><span>{hall}{address ? `, ${address}` : ""}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Payment via</span><span>{paymentMethods.find(p => p.id === payMethod)?.label}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Delivery fee</span><span>GHS {delivery}</span></div>
                    <div className="flex justify-between font-bold border-t border-white/10 pt-2">
                      <span>Total</span><span className="text-blue-400">GHS {orderTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 text-green-400" />
                    256-bit SSL encrypted · Protected by Paystack
                  </div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => setStep(1)} className="flex-1 glass border border-white/10 rounded-xl py-3 text-sm font-medium hover:bg-white/5 transition-all">Back</button>
                    <button id="place-order-btn" onClick={handlePay} disabled={processing}
                      className="flex-[2] bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold py-3 rounded-xl hover:shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                      {processing ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Redirecting to Paystack...</>
                      ) : `Pay GHS ${orderTotal.toLocaleString()} Now`}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5 h-fit">
              <h3 className="font-display font-bold text-base mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {cartItems.map(item => (
                  <div key={item.product_id} className="flex items-center gap-2">
                    {item.product?.images?.[0] ? (
                      <img src={item.product.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <Package className="w-4 h-4 text-muted-foreground/30" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.product?.title}</p>
                      <p className="text-[10px] text-muted-foreground">×{item.quantity}</p>
                    </div>
                    <span className="text-xs font-bold text-foreground flex-shrink-0">GHS {(item.product?.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-3 space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span>GHS {total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery</span><span>GHS {delivery}</span>
                </div>
                <div className="flex justify-between font-display font-black text-base border-t border-white/10 pt-1.5">
                  <span>Total</span><span className="text-blue-400">GHS {orderTotal.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
