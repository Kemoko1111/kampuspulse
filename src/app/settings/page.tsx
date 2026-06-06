"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Bell, Shield, Moon, Globe, Trash2, LogOut, ChevronRight, User, CreditCard, Smartphone } from "lucide-react";
import { Sidebar, MobileNav, TopBar } from "@/components/layout/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const settingSections = [
  {
    title: "Account",
    items: [
      { label: "Edit Profile", icon: User, href: "/profile" },
      { label: "Verification & ID", icon: Shield, href: "#" },
      { label: "Change Password", icon: Shield, href: "#" },
    ],
  },
  {
    title: "Notifications",
    items: [
      { label: "Push Notifications", icon: Bell, toggle: true, key: "push" },
      { label: "Email Notifications", icon: Bell, toggle: true, key: "email" },
      { label: "SMS Alerts", icon: Smartphone, toggle: true, key: "sms" },
    ],
  },
  {
    title: "Payments",
    items: [
      { label: "Saved Payment Methods", icon: CreditCard, href: "#" },
      { label: "Transaction History", icon: CreditCard, href: "#" },
    ],
  },
  {
    title: "More",
    items: [
      { label: "Language", icon: Globe, value: "English (Ghana)", href: "#" },
      { label: "Privacy Policy", icon: Shield, href: "#" },
      { label: "Terms of Service", icon: Shield, href: "#" },
    ],
  },
];

export default function SettingsPage() {
  const [toggles, setToggles] = useState({ push: true, email: true, sms: false });
  const toggle = (key: string) => setToggles(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar title="Settings" />
      <main className="lg:pl-64 pb-20 lg:pb-0 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display font-black text-3xl mb-1">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your CampusPulse preferences</p>
          </motion.div>

          {/* Theme */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Moon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-sm">App Theme</div>
                  <div className="text-xs text-muted-foreground">Toggle dark / light mode</div>
                </div>
              </div>
              <ThemeToggle />
            </div>
          </motion.div>

          {/* Setting sections */}
          {settingSections.map((section, si) => (
            <motion.div key={section.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + si * 0.05 }} className="glass-card overflow-hidden">
              <div className="px-5 py-3 border-b border-white/5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{section.title}</h2>
              </div>
              <div className="divide-y divide-white/5">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{item.label}</span>
                      {"value" in item && item.value && <span className="text-xs text-muted-foreground ml-2">{item.value}</span>}
                    </div>
                    {"toggle" in item && item.toggle ? (
                      <button onClick={() => toggle(item.key!)}
                        className={`relative w-11 h-6 rounded-full transition-all ${(toggles as any)[item.key!] ? "bg-blue-500" : "bg-white/20"}`}>
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${(toggles as any)[item.key!] ? "left-5" : "left-0.5"}`} />
                      </button>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Danger zone */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card overflow-hidden border border-red-500/10">
            <div className="px-5 py-3 border-b border-red-500/10">
              <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Danger Zone</h2>
            </div>
            <div className="divide-y divide-white/5">
              <button className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-500/5 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm font-medium text-red-400">Sign Out</span>
              </button>
              <button className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-red-500/5 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-sm font-medium text-red-400">Delete Account</span>
              </button>
            </div>
          </motion.div>

          <p className="text-center text-xs text-muted-foreground pb-4">CampusPulse v1.0 · University of Cape Coast</p>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
