"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  GraduationCap,
  Bike,
  CreditCard,
  Tag,
  Star,
  BarChart3,
  Bell,
  Settings,
  Zap,
  ArrowLeft,
  Menu,
  X,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/* ─── Navigation structure ─── */
const navSections = [
  {
    label: "MAIN",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: Package },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { href: "/admin/shop", label: "Shop", icon: ShoppingBag },
      { href: "/admin/students", label: "Students", icon: GraduationCap },
      { href: "/admin/riders", label: "Riders", icon: Bike },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/promotions", label: "Promotions", icon: Tag },
    ],
  },
  {
    label: "INSIGHTS",
    items: [
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    label: "SYSTEM",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

/* ─── Check active state ─── */
function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

/* ─── Breadcrumb from pathname ─── */
function getBreadcrumb(pathname: string) {
  const segments = pathname.replace("/admin", "").split("/").filter(Boolean);
  if (segments.length === 0) return "Dashboard";
  return segments
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "))
    .join(" / ");
}

/* ─── Sidebar content (shared between desktop & mobile) ─── */
function SidebarContent({
  pathname,
  profile,
  onNavigate,
}: {
  pathname: string;
  profile: { full_name?: string; role?: string; hall_of_residence?: string } | null;
  onNavigate?: () => void;
}) {
  const initials =
    profile?.full_name?.substring(0, 2).toUpperCase() || "AD";

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 mb-2">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center glow-blue flex-shrink-0 shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display font-black text-lg gradient-text leading-none">
              KampusPulse
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield className="w-3 h-3 text-blue-400" />
              <span className="text-[11px] text-blue-400 font-semibold tracking-wide">
                Admin Panel
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-5 scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.label}>
            <div className="px-3 mb-2">
              <span className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground/60 uppercase">
                {section.label}
              </span>
            </div>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative",
                      active
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-[18px] h-[18px] flex-shrink-0 transition-colors",
                        active
                          ? "text-blue-400"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="truncate">{label}</span>
                    {active && (
                      <motion.div
                        layoutId="admin-nav-dot"
                        className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pt-3 mt-auto border-t border-white/5 space-y-1">
        <Link
          href="/home"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          Back to App
        </Link>
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>

      {/* Admin profile card */}
      <div className="px-3 pb-4 pt-2">
        <div className="glass border border-white/10 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-lg shadow-blue-500/20">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {profile?.full_name || "Admin"}
            </div>
            <div className="text-xs text-muted-foreground capitalize">
              {profile?.role || "admin"} •{" "}
              {profile?.hall_of_residence || "Campus"}
            </div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 shadow-sm shadow-emerald-400/50" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Admin Layout ─── */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Guard: redirect non-admins
  useEffect(() => {
    if (!loading && profile && profile.role !== "admin") {
      router.replace("/home");
    }
  }, [loading, profile, router]);

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center animate-pulse">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  // Block non-admins (while redirect fires)
  if (!profile || profile.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-[280px] glass border-r border-white/5 z-40">
        <SidebarContent pathname={pathname} profile={profile} />
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="lg:hidden sticky top-0 z-50 glass border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span className="font-display font-bold gradient-text">
                  Admin
                </span>
                <ChevronRight className="w-3 h-3" />
                <span className="font-medium text-foreground">
                  {getBreadcrumb(pathname)}
                </span>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Mobile Drawer (overlay + sidebar) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="admin-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.aside
              key="admin-drawer"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] z-50 glass border-r border-white/5"
            >
              {/* Close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-3 w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors z-10"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent
                pathname={pathname}
                profile={profile}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="lg:pl-[280px] min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
