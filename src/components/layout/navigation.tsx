"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home, ShoppingBag, Briefcase, Bike,
  MessageSquare, Bell, User, Zap, Settings,
  LayoutDashboard,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

import { useAuth } from "@/contexts/auth-context";

const studentNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/edwom", label: "EDWOM", icon: ShoppingBag },
  { href: "/y3adwuma", label: "Y3 Adwuma", icon: Briefcase },
  { href: "/ezzyride", label: "EzzyRide", icon: Bike },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

const vendorNav = [
  { href: "/vendor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/edwom", label: "Marketplace", icon: ShoppingBag },
  { href: "/y3adwuma", label: "Tasks", icon: Briefcase },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

const riderNav = [
  { href: "/rider", label: "Driver App", icon: Bike },
  { href: "/y3adwuma", label: "Tasks", icon: Briefcase },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  
  const navItems = profile?.role === "vendor" ? vendorNav 
                 : profile?.role === "rider" ? riderNav 
                 : studentNav;

  const initials = profile?.full_name?.substring(0, 2).toUpperCase() || "ST";

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 glass border-r border-white/5 z-40 p-4">
      {/* Logo */}
      <Link href="/home" className="flex items-center gap-2.5 px-2 py-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center glow-blue flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-display font-black text-lg gradient-text leading-none">CampusPulse</div>
          <div className="text-[10px] text-muted-foreground">University of Cape Coast</div>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              active
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {active && (
                <motion.div layoutId="sidebar-active" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-white/5 pt-4 mt-4">
        <Link href="/notifications" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
          <Bell className="w-4 h-4" />
          Notifications
          <span className="ml-auto bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
        </Link>
        <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
          <User className="w-4 h-4" />
          Profile
        </Link>
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>

      {/* User profile mini card */}
      <div className="glass border border-white/10 rounded-xl p-3 flex items-center gap-3 mt-4">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{profile?.full_name || "Student"}</div>
          <div className="text-xs text-muted-foreground capitalize">{profile?.role || "student"} • {profile?.hall_of_residence || "Campus"}</div>
        </div>
        <div className="status-dot-online flex-shrink-0" />
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { profile } = useAuth();
  
  const navItems = profile?.role === "vendor" ? vendorNav 
                 : profile?.role === "rider" ? riderNav 
                 : studentNav;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200",
              active ? "text-blue-400" : "text-muted-foreground"
            )}>
              <div className={cn("relative p-1.5 rounded-lg transition-all", active && "bg-blue-500/15")}>
                <Icon className="w-5 h-5" />
                {active && <motion.div layoutId="mobile-active" className="absolute inset-0 rounded-lg bg-blue-500/10" />}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopBar({ title }: { title?: string }) {
  const { profile } = useAuth();
  const initials = profile?.full_name?.substring(0, 2).toUpperCase() || "ST";

  return (
    <header className="lg:hidden sticky top-0 z-40 glass border-b border-white/5 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg gradient-text">
            {title || "CampusPulse"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/notifications" className="relative w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">3</span>
          </Link>
          <Link href="/profile" className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </Link>
        </div>
      </div>
    </header>
  );
}
