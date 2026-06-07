"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import {
  Eye, EyeOff, Mail, Lock, User, Phone,
  Zap, ArrowRight, ArrowLeft, CheckCircle,
  ShoppingBag, Bike, Shield, AlertCircle, Chrome,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signInWithGoogle } from "@/lib/auth-oauth";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

type Role = "student" | "rider";

const roles = [
  {
    id: "student" as Role,
    icon: User,
    title: "Student",
    desc: "Buy, sell, earn & ride on campus",
    color: "blue",
    border: "border-blue-500/40",
    bg: "bg-blue-500/10",
  },
  {
    id: "rider" as Role,
    icon: Bike,
    title: "Rider",
    desc: "Deliver packages & offer rides",
    color: "purple",
    border: "border-purple-500/40",
    bg: "bg-purple-500/10",
  },
];

const steps = ["Role", "Profile", "Account", "Done"];

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [role, setRole] = useState<Role>("student");
  const { signUp } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    phone: "",
    password: "",
    fullName: "",
    studentId: "",
    department: "",
    hallOfResidence: "",
  });

  const updateForm = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!form.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error } = await signUp({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
        role,
        studentId: form.studentId,
        department: form.department,
        hallOfResidence: form.hallOfResidence,
      });
      if (error) {
        setError(error);
      } else {
        next(); // go to Done step
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);

    const regData = JSON.stringify({
      role,
      full_name: form.fullName,
      phone: form.phone,
      student_id: form.studentId,
      department: form.department,
      hall_of_residence: form.hallOfResidence,
    });
    document.cookie = `kampuspulse_reg_data=${encodeURIComponent(regData)}; path=/; max-age=3600; SameSite=Lax`;

    const supabase = createClient();
    const { error: oauthError } = await signInWithGoogle(supabase, "/home");
    if (oauthError) {
      setError(oauthError);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center glow-blue">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-black text-2xl gradient-text">KampusPulse</span>
          </Link>
          <h1 className="font-display font-bold text-3xl text-foreground mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm">Join 12,000+ UCC students on KampusPulse</p>
        </motion.div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8 px-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex flex-col items-center gap-1`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${i < step ? "bg-blue-500 text-white" : i === step ? "bg-blue-500 text-white ring-4 ring-blue-500/20" : "bg-white/5 text-muted-foreground border border-white/10"}`}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-blue-400" : "text-muted-foreground"}`}>{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 mx-2 transition-all duration-500 ${i < step ? "bg-blue-500" : "bg-white/10"}`} style={{ width: 40 }} />
              )}
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="glass-card p-8"
        >
          {/* Step 0: Role */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl mb-1">Choose your role</h2>
              <p className="text-sm text-muted-foreground mb-4">You can always change this later in settings.</p>
              <div className="space-y-3">
                {roles.map(({ id, icon: Icon, title, desc, border, bg }) => (
                  <button key={id} id={`role-${id}`} onClick={() => setRole(id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left
                      ${role === id ? `${border} ${bg}` : "border-white/10 hover:border-white/20"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === id ? bg : "bg-white/5"} border ${role === id ? border : "border-white/10"}`}>
                      <Icon className="w-5 h-5" style={{ color: id === "student" ? "#60a5fa" : "#a78bfa" }} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-foreground">{title}</div>
                      <div className="text-xs text-muted-foreground">{desc}</div>
                    </div>
                    {role === id && <CheckCircle className="w-5 h-5 text-blue-400" />}
                  </button>
                ))}
              </div>
              <button id="reg-next-0" onClick={next} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 1: Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl mb-4">Complete your profile</h2>

              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name <span className="text-red-400">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="reg-fullname" type="text" value={form.fullName}
                    onChange={e => { updateForm("fullName", e.target.value); setError(null); }}
                    placeholder="e.g. Kwame Asante" className="input-premium pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone (Ghana)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="reg-phone" type="tel" value={form.phone} onChange={e => updateForm("phone", e.target.value)}
                    placeholder="0244 123 456" className="input-premium pl-10" />
                </div>
              </div>
              {role === "student" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Student ID</label>
                    <input id="reg-studentid" type="text" value={form.studentId} onChange={e => updateForm("studentId", e.target.value)}
                      placeholder="UCC/ST/2024/001" className="input-premium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Department</label>
                    <input id="reg-department" type="text" value={form.department} onChange={e => updateForm("department", e.target.value)}
                      placeholder="e.g. Computer Science" className="input-premium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hall of Residence</label>
                    <select id="reg-hall" value={form.hallOfResidence} onChange={e => updateForm("hallOfResidence", e.target.value)}
                      className="input-premium">
                      <option value="">Select hall...</option>
                      {["Atlantic Hall", "Casely Hayford Hall", "Adehye Hall", "Valco Hall", "Kwame Nkrumah Hall", "None / Off Campus"].map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={back} className="flex-1 flex items-center justify-center gap-2 glass border border-white/10 rounded-xl py-3 text-sm font-medium hover:bg-white/5 transition-all">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button id="reg-next-1" onClick={next} disabled={!form.fullName.trim()}
                  className="flex-[2] btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Account */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-xl mb-4">Create your account</h2>

              {/* Error banner */}
              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Social login */}
              <button
                onClick={handleGoogleLogin}
                type="button"
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 glass border border-white/10 rounded-xl px-4 py-3 text-sm font-medium hover:bg-white/5 transition-all mb-4 disabled:opacity-50"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Chrome className="w-4 h-4" />
                )}
                {googleLoading ? "Redirecting to Google..." : "Continue with Google"}
              </button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground">
                    or continue with email
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="reg-email" type="email" value={form.email} onChange={e => updateForm("email", e.target.value)}
                    placeholder="you@stu.ucc.edu.gh" className="input-premium pl-10" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="reg-password" type={showPassword ? "text" : "password"} value={form.password}
                    onChange={e => updateForm("password", e.target.value)}
                    placeholder="Min. 8 characters" className="input-premium pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={back} className="flex-1 flex items-center justify-center gap-2 glass border border-white/10 rounded-xl py-3 text-sm font-medium hover:bg-white/5 transition-all">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button id="reg-submit" onClick={handleSubmit} disabled={loading}
                  className="flex-[2] btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                  ) : (<>Create Account <ArrowRight className="w-4 h-4" /></>)}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="font-display font-black text-2xl mb-2">Account Created! 🎉</h2>
              <p className="text-muted-foreground text-sm mb-2">
                Welcome to KampusPulse, <span className="text-foreground font-semibold">{form.fullName || "friend"}</span>!
              </p>
              {/* Email confirmation notice */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-0.5">Check your email</p>
                    <p className="text-xs text-muted-foreground">
                      We sent a confirmation link to <span className="text-blue-400">{form.email}</span>.
                      Click it to activate your account, then sign in.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Link href="/login" id="go-login" className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                  Go to Login <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                  <Shield className="w-3.5 h-3.5" />
                  Your data is protected with bank-level security
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {step < 3 && (
          <p className="text-center mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Sign in →</Link>
          </p>
        )}
      </div>
    </div>
  );
}
