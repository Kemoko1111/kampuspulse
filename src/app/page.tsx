"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Briefcase,
  Bike,
  ArrowRight,
  Star,
  Users,
  Package,
  ChevronRight,
  MapPin,
  Bell,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: ShoppingBag,
    title: "EDWOM",
    subtitle: "Student Marketplace",
    description:
      "Buy & sell products, textbooks, electronics, fashion and more from fellow UCC students and verified vendors.",
    color: "from-blue-600 to-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    href: "/edwom",
    stats: "2,400+ Products",
    gradient: "module-card-edwom",
  },
  {
    icon: Briefcase,
    title: "Y3 ADWUMA",
    subtitle: "Student Task Platform",
    description:
      "Post tasks, earn money, or get help with assignments, errands, printing, tutoring and more.",
    color: "from-emerald-600 to-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    href: "/y3adwuma",
    stats: "850+ Active Tasks",
    gradient: "module-card-y3adwuma",
  },
  {
    icon: Bike,
    title: "EZZYRIDE",
    subtitle: "Campus Delivery & Rides",
    description:
      "Get fast campus deliveries and rides with live tracking powered by Google Maps.",
    color: "from-purple-600 to-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    href: "/ezzyride",
    stats: "120+ Riders Online",
    gradient: "module-card-ezzyride",
  },
];

const stats = [
  { value: "12,000+", label: "UCC Students", icon: Users },
  { value: "2,400+", label: "Products Listed", icon: Package },
  { value: "850+", label: "Tasks Completed", icon: Briefcase },
  { value: "4.9★", label: "Average Rating", icon: Star },
];

const testimonials = [
  {
    name: "Abena Mensah",
    role: "Level 300 Student",
    text: "KampusPulse changed how I buy and sell on campus. EDWOM is just amazing!",
    avatar: "AM",
    rating: 5,
  },
  {
    name: "Kweku Asante",
    role: "Computer Science, Level 200",
    text: "I made GHS 800 last month just doing tasks on Y3 ADWUMA. Best hustle!",
    avatar: "KA",
    rating: 5,
  },
  {
    name: "Ama Darko",
    role: "Business Administration",
    text: "EZZYRIDE delivered my food in 12 minutes. The tracking feature is 🔥",
    avatar: "AD",
    rating: 5,
  },
];

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Grid background */}
      <div className="fixed inset-0 grid-pattern opacity-30 pointer-events-none" />

      {/* Gradient orbs */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center glow-blue">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl gradient-text">
                KampusPulse
              </span>
            </div>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Reviews
              </a>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="btn-primary text-sm py-2 px-4"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 glass border border-blue-500/20 rounded-full px-4 py-1.5 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">
              Now live at{" "}
              <span className="text-foreground font-semibold">
                University of Cape Coast
              </span>
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display font-black text-5xl md:text-7xl lg:text-8xl leading-tight mb-6"
          >
            Your Campus.{" "}
            <span className="gradient-text">Your Pulse.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            The all-in-one digital ecosystem for UCC students. Shop, earn, and
            move — powered by a community that gets campus life.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="group btn-primary flex items-center gap-2 text-base px-8 py-4"
            >
              Start for Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Already have an account?
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center justify-center gap-6 mt-12 flex-wrap"
          >
            {[
              { icon: Shield, text: "Bank-level Security" },
              { icon: Zap, text: "Instant Payments" },
              { icon: MapPin, text: "Live Tracking" },
              { icon: Bell, text: "Smart Notifications" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Icon className="w-3.5 h-3.5 text-blue-400" />
                {text}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-muted-foreground">Scroll to explore</span>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-blue-400 animate-bounce" />
          </div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section id="about" className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(({ value, label, icon: Icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="font-display font-black text-2xl md:text-3xl text-foreground mb-1">
                  {value}
                </div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES / MODULES ── */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-black text-4xl md:text-5xl mb-4">
              Three Platforms.{" "}
              <span className="gradient-text">One Ecosystem.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything a UCC student needs, built specifically for campus life.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map(
              (
                {
                  icon: Icon,
                  title,
                  subtitle,
                  description,
                  color,
                  bg,
                  border,
                  href,
                  stats,
                  gradient,
                },
                i
              ) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="group"
                >
                  <Link href={href}>
                    <div
                      className={`relative overflow-hidden rounded-3xl p-8 h-full transition-all duration-300
                        glass-card border border-white/10 hover:border-white/20
                        hover:shadow-card-hover cursor-pointer`}
                    >
                      {/* Gradient background */}
                      <div
                        className={`absolute inset-0 ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`}
                      />

                      {/* Icon */}
                      <div
                        className={`relative w-14 h-14 rounded-2xl ${bg} border ${border} flex items-center justify-center mb-6`}
                      >
                        <Icon className={`w-7 h-7 bg-gradient-to-br ${color} bg-clip-text`} style={{ color: i === 0 ? '#60a5fa' : i === 1 ? '#34d399' : '#a78bfa' }} />
                      </div>

                      {/* Content */}
                      <div className="relative">
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                          {subtitle}
                        </div>
                        <h3 className="font-display font-black text-2xl mb-3 text-foreground">
                          {title}
                        </h3>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                          {description}
                        </p>

                        {/* Stats badge */}
                        <div
                          className={`inline-flex items-center gap-2 ${bg} border ${border} rounded-full px-3 py-1 text-xs font-medium`}
                          style={{ color: i === 0 ? '#60a5fa' : i === 1 ? '#34d399' : '#a78bfa' }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          {stats}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-display font-black text-4xl md:text-5xl mb-4">
              Loved by{" "}
              <span className="gradient-text">UCC Students</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, avatar, rating }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: rating }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                  &ldquo;{text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-sm font-bold">
                    {avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">
                      {name}
                    </div>
                    <div className="text-xs text-muted-foreground">{role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mx-auto mb-6 glow-blue">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display font-black text-4xl mb-4">
                Ready to join{" "}
                <span className="gradient-text">KampusPulse?</span>
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Join 12,000+ UCC students already buying, selling, earning, and
                moving smarter.
              </p>
              <Link
                href="/register"
                className="btn-primary inline-flex items-center gap-2 text-base px-8 py-4"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display font-bold text-lg gradient-text">
                KampusPulse
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              © 2025 KampusPulse. Built with ❤️ for University of Cape Coast students.
            </p>
            <div className="flex gap-6">
              {["Privacy", "Terms", "Support"].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
