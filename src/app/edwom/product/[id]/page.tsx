"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Star, Heart, ShoppingCart, Share2,
  MessageSquare, Shield, Truck, RotateCcw,
  Flame, MapPin, Loader2, Package,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import type { Product, ProductCondition } from "@/types";

const conditionLabels: Record<ProductCondition, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [activeImage, setActiveImage] = useState(0);
  const [wishlist, setWishlist] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [adding, setAdding] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const res = await fetch(`/api/products/${id}`);
      if (res.ok) {
        const { data } = await res.json();
        setProduct(data);
      } else {
        setError("Product not found");
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    const ok = await addItem(product.id, 1);
    if (ok) setAddedToCart(true);
    setAdding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <Package className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground mb-4">{error || "Product not found"}</p>
        <Link href="/edwom" className="btn-primary px-6 py-2.5 text-sm">Back to Marketplace</Link>
      </div>
    );
  }

  const seller = product.seller;
  const categoryName = product.category?.name || "Uncategorized";
  const conditionLabel = conditionLabels[product.condition] || product.condition;
  const sellerInitials = seller?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "??";

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Link href="/edwom" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* ── LEFT: Images ── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="glass-card aspect-square flex items-center justify-center mb-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
              {product.images?.[activeImage] ? (
                <img src={product.images[activeImage]} alt={product.title} className="relative z-10 w-full h-full object-cover" />
              ) : (
                <Package className="relative z-10 w-20 h-20 text-muted-foreground/30" />
              )}
              {product.is_featured && (
                <span className="absolute top-4 left-4 badge-hot flex items-center gap-1 text-sm px-3 py-1 z-20">
                  <Flame className="w-3.5 h-3.5" /> Hot Deal
                </span>
              )}
              {product.original_price && (
                <span className="absolute top-4 right-4 badge-sale text-sm px-3 py-1 z-20">
                  -{Math.round((1 - product.price / product.original_price) * 100)}% OFF
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {(product.images?.length ? product.images : [null]).map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-xl glass border flex items-center justify-center transition-all overflow-hidden
                    ${activeImage === i ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/20"}`}>
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-muted-foreground/30" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── RIGHT: Details ── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{categoryName} · {conditionLabel}</p>
              <h1 className="font-display font-black text-2xl text-foreground leading-tight mb-3">{product.title}</h1>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-sm">{product.rating || "—"}</span>
                  <span className="text-sm text-muted-foreground">({product.total_reviews || 0} reviews)</span>
                </div>
                <span className="text-xs text-muted-foreground">{product.views || 0} views</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-display font-black text-4xl text-blue-400">GHS {product.price.toLocaleString()}</span>
                {product.original_price && (
                  <span className="text-lg text-muted-foreground line-through">GHS {product.original_price.toLocaleString()}</span>
                )}
              </div>
            </div>

            {seller && (
              <div className="glass border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
                    {sellerInitials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{seller.full_name}</span>
                      {seller.is_verified && <Shield className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {seller.rating || "—"} rating
                    </div>
                  </div>
                  <Link href="/messages" className="flex items-center gap-1 text-xs text-blue-400 border border-blue-500/30 rounded-lg px-3 py-1.5 hover:bg-blue-500/10 transition-all">
                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                  </Link>
                </div>
                {product.location && (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {product.location}</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Shield, label: "Buyer Protection" },
                { icon: Truck, label: "Campus Delivery" },
                { icon: RotateCcw, label: "Easy Returns" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="glass border border-white/10 rounded-xl p-3 text-center">
                  <Icon className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                id="add-to-cart"
                onClick={handleAddToCart}
                disabled={adding || addedToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all
                  ${addedToCart ? "bg-green-500/10 text-green-400 border border-green-500/30" : "btn-primary"}`}>
                <ShoppingCart className="w-4 h-4" />
                {adding ? "Adding..." : addedToCart ? "Added to Cart ✓" : "Add to Cart"}
              </button>
              <button onClick={() => setWishlist(!wishlist)}
                className="w-12 h-12 glass border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
                <Heart className={`w-5 h-5 ${wishlist ? "fill-red-400 text-red-400" : "text-muted-foreground"}`} />
              </button>
              <button className="w-12 h-12 glass border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
                <Share2 className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <Link href="/edwom/checkout" className="w-full block text-center bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold py-3 rounded-xl hover:shadow-glow transition-all">
              Buy Now – GHS {product.price.toLocaleString()}
            </Link>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
            <h2 className="font-display font-bold text-lg mb-3">Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description || "No description provided."}</p>
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {product.tags.map(tag => (
                  <span key={tag} className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-3 py-1">{tag}</span>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-6">
            <h2 className="font-display font-bold text-lg mb-3">Specifications</h2>
            <div className="space-y-2">
              {[
                { label: "Condition", value: conditionLabel },
                { label: "Category", value: categoryName },
                { label: "Stock", value: String(product.stock_quantity) },
                { label: "Location", value: product.location || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
