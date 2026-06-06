"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft,
  ArrowRight, Tag, ShieldCheck, Truck, Loader2, Package,
} from "lucide-react";
import { Sidebar, MobileNav, TopBar } from "@/components/layout/navigation";
import { useCart } from "@/hooks/useCart";

interface CartProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  stock_quantity: number;
}

interface CartItemRow {
  product_id: string;
  quantity: number;
  product: CartProduct;
}

export default function CartPage() {
  const { items, loading, updateQuantity, removeItem, total } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const cartItems = items as CartItemRow[];

  const handleUpdateQty = async (productId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      await removeItem(productId);
    } else {
      await updateQuantity(productId, newQty);
    }
  };

  const subtotal = total;
  const deliveryFee = 5;
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const orderTotal = subtotal + deliveryFee - discount;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar title="Cart" />
      <main className="lg:pl-64 pb-20 lg:pb-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/edwom" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Continue Shopping
            </Link>
            <span className="text-muted-foreground/40">•</span>
            <h1 className="font-display font-black text-2xl">
              Cart <span className="text-blue-400">({cartItems.length})</span>
            </h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground text-sm mb-6">Discover great products on EDWOM</p>
              <Link href="/edwom" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
                Browse Marketplace <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <AnimatePresence>
                  {cartItems.map((item, i) => (
                    <motion.div key={item.product_id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }} transition={{ delay: i * 0.05 }}
                      className="glass-card p-4 flex gap-4">
                      <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-8 h-8 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <h3 className="font-semibold text-sm text-foreground leading-tight">{item.product?.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">Qty available: {item.product?.stock_quantity}</p>
                          </div>
                          <button onClick={() => removeItem(item.product_id)}
                            className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-all flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleUpdateQty(item.product_id, item.quantity, -1)}
                              className="w-7 h-7 rounded-lg glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-semibold text-sm">{item.quantity}</span>
                            <button onClick={() => handleUpdateQty(item.product_id, item.quantity, 1)}
                              disabled={item.quantity >= (item.product?.stock_quantity || 1)}
                              className="w-7 h-7 rounded-lg glass border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-40">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-right">
                            <div className="font-display font-black text-base text-blue-400">
                              GHS {((item.product?.price || 0) * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { icon: ShieldCheck, label: "Buyer Protection" },
                    { icon: Truck, label: "Campus Delivery" },
                    { icon: Tag, label: "Best Prices" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="glass border border-white/10 rounded-xl p-3 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
                  <h3 className="font-display font-bold text-base mb-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-400" /> Promo Code
                  </h3>
                  <div className="flex gap-2">
                    <input id="promo-input" type="text" value={promoCode}
                      onChange={e => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="e.g. CAMPUS10"
                      className="input-premium flex-1 py-2 text-sm" disabled={promoApplied} />
                    <button id="apply-promo"
                      onClick={() => promoCode === "CAMPUS10" && setPromoApplied(true)}
                      disabled={promoApplied || !promoCode}
                      className="px-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-semibold hover:bg-blue-500/20 transition-all disabled:opacity-50">
                      {promoApplied ? "✓ Applied" : "Apply"}
                    </button>
                  </div>
                  {promoApplied && (
                    <p className="text-xs text-green-400 mt-2">🎉 CAMPUS10 — 10% discount applied!</p>
                  )}
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
                  <h3 className="font-display font-bold text-base mb-4">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                      <span>GHS {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery fee</span>
                      <span>GHS {deliveryFee}</span>
                    </div>
                    {promoApplied && (
                      <div className="flex justify-between text-green-400">
                        <span>Discount (CAMPUS10)</span>
                        <span>- GHS {discount}</span>
                      </div>
                    )}
                    <div className="border-t border-white/10 pt-2 flex justify-between font-display font-black text-lg">
                      <span>Total</span>
                      <span className="text-blue-400">GHS {orderTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <Link href="/edwom/checkout" id="proceed-checkout"
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 mt-4">
                    Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Secure payment via Paystack Ghana
                  </p>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
