"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useCallback } from "react";
import {
  Search, SlidersHorizontal, ShoppingCart, Heart,
  Star, ArrowRight, Flame, Grid3X3, List,
  ChevronRight, Package, Smartphone, Shirt, BookOpen,
  Utensils, Sparkles, Home, Cpu, ShoppingBag, Loader2, AlertCircle,
} from "lucide-react";
import { useProducts, useCart } from "@/hooks";
import { formatCurrency } from "@/lib/utils";

const categories = [
  { id: "all",         name: "All",            icon: Grid3X3 },
  { id: "electronics", name: "Electronics",    icon: Smartphone },
  { id: "fashion",     name: "Fashion",        icon: Shirt },
  { id: "books",       name: "Books",          icon: BookOpen },
  { id: "food",        name: "Food & Drinks",  icon: Utensils },
  { id: "beauty",      name: "Beauty",         icon: Sparkles },
  { id: "hostel",      name: "Hostel Items",   icon: Home },
  { id: "tech",        name: "Tech Accessories",icon: Cpu },
];

const sortOptions = [
  { value: "created_at", label: "Newest" },
  { value: "price",      label: "Price: Low to High" },
  { value: "rating",     label: "Top Rated" },
  { value: "views",      label: "Most Viewed" },
];

export default function EdwomPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode]             = useState<"grid" | "list">("grid");
  const [search, setSearch]                 = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort]                     = useState("created_at");
  const [wishlist, setWishlist]             = useState<string[]>([]);
  const { addItem, count: cartCount } = useCart();

  const { products, count, loading, error } = useProducts({
    category: activeCategory === "all" ? undefined : activeCategory,
    search: debouncedSearch || undefined,
    sort,
  });

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    clearTimeout((window as any).__searchTimer);
    (window as any).__searchTimer = setTimeout(() => setDebouncedSearch(val), 400);
  }, []);

  const toggleWishlist = (id: string) =>
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleAddToCart = async (e: React.MouseEvent, product: { id: string }) => {
    e.preventDefault();
    await addItem(product.id, 1);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-black text-3xl md:text-4xl">
              <span className="text-blue-400">EDWOM</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              UCC Student Marketplace {count > 0 && `· ${count} listings`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/edwom/sell" className="btn-primary text-sm px-4 py-2 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" /> Sell
            </Link>
            <Link href="/edwom/cart" id="cart-btn" className="relative w-10 h-10 glass border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
            </Link>
          </div>
        </motion.div>

        {/* ── SEARCH + SORT ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input id="edwom-search" type="search" value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search products, brands, sellers..." className="input-premium pl-11" />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="glass border border-white/10 rounded-xl px-3 text-xs text-muted-foreground bg-transparent">
            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </motion.div>

        {/* ── CATEGORIES ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(({ id, name, icon: Icon }) => (
              <button key={id} id={`cat-${id}`} onClick={() => setActiveCategory(id)}
                className={`flex-none flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all border
                  ${activeCategory === id
                    ? "bg-blue-500 text-white border-blue-500"
                    : "glass border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20"}`}>
                <Icon className="w-3.5 h-3.5" />
                {name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── PRODUCTS GRID ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">
              {loading ? "Loading..." : `${count} Products`}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setViewMode("grid")} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${viewMode === "grid" ? "bg-blue-500 text-white" : "glass border border-white/10 text-muted-foreground"}`}>
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode("list")} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${viewMode === "list" ? "bg-blue-500 text-white" : "glass border border-white/10 text-muted-foreground"}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <h3 className="font-display font-bold text-lg mb-1">No products found</h3>
              <p className="text-muted-foreground text-sm">Be the first to list something!</p>
              <Link href="/edwom/sell" className="btn-primary mt-4 px-6 py-2.5 text-sm">
                Sell Now
              </Link>
            </div>
          ) : (
            <div className={viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              : "space-y-3"}>
              {(products as any[]).map((product: any, i: number) => (
                <motion.div key={product.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className={viewMode === "list" ? "glass-card p-4 flex gap-4 hover:border-white/20 transition-all" : ""}>
                  {viewMode === "grid" ? (
                    <Link href={`/edwom/product/${product.id}`}>
                      <div className="glass-card overflow-hidden hover:scale-[1.02] hover:shadow-card-hover transition-all cursor-pointer group">
                        {/* Image */}
                        <div className="relative aspect-square bg-white/5 flex items-center justify-center overflow-hidden">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-12 h-12 text-muted-foreground/30" />
                          )}
                          {product.is_featured && (
                            <span className="absolute top-2 left-2 badge-hot flex items-center gap-1">
                              <Flame className="w-3 h-3" /> Hot
                            </span>
                          )}
                          {product.original_price && (
                            <span className="absolute top-2 right-2 badge-sale">
                              -{Math.round((1 - product.price / product.original_price) * 100)}%
                            </span>
                          )}
                          <button onClick={e => { e.preventDefault(); toggleWishlist(product.id); }}
                            className="absolute bottom-2 right-2 w-8 h-8 rounded-full glass border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? "fill-red-400 text-red-400" : "text-muted-foreground"}`} />
                          </button>
                        </div>
                        {/* Info */}
                        <div className="p-3">
                          <p className="text-[10px] text-muted-foreground mb-0.5">{product.category?.name || "Other"}</p>
                          <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2 mb-2">{product.title}</h3>
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{product.rating?.toFixed(1) || "New"}</span>
                            <span className="text-xs text-muted-foreground">({product.total_reviews || 0})</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-display font-black text-base text-blue-400">{formatCurrency(product.price)}</span>
                              {product.original_price && <span className="text-xs text-muted-foreground line-through ml-1">{formatCurrency(product.original_price)}</span>}
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1 truncate">by {product.seller?.full_name || "Unknown"}</p>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                        ) : <Package className="w-8 h-8 text-muted-foreground/30" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm text-foreground line-clamp-2">{product.title}</h3>
                          {product.is_featured && <span className="badge-hot flex items-center gap-1 flex-shrink-0"><Flame className="w-3 h-3" /> Hot</span>}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{product.rating?.toFixed(1) || "New"}</span>
                          <span className="text-xs text-muted-foreground">• {product.seller?.full_name}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <span className="font-display font-black text-base text-blue-400">{formatCurrency(product.price)}</span>
                            {product.original_price && <span className="text-xs text-muted-foreground line-through ml-1">{formatCurrency(product.original_price)}</span>}
                          </div>
                          <Link href={`/edwom/product/${product.id}`} className="text-xs text-blue-400 flex items-center gap-1">View <ChevronRight className="w-3 h-3" /></Link>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
