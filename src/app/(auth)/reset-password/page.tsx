"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowLeft, Zap, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/lib/supabase/client";
import { passwordSchema } from "@/lib/validators/auth";

// Reached two ways: (1) directly, to request a reset email, or (2) via the
// link in that email, which authenticates the user and redirects back here
// with ?recovery=1 (see resetPassword() in auth-context.tsx) — that's when
// the actual "set a new password" form below is shown instead.
function NewPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="font-display font-bold text-xl mb-2">Password updated!</h2>
        <p className="text-muted-foreground text-sm">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium">New password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="password" required minLength={8} value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" className="input-premium pl-10" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Confirm new password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="password" required minLength={8} value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="••••••••" className="input-premium pl-10" />
        </div>
      </div>
      <button type="submit" disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50">
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
        ) : "Set New Password"}
      </button>
    </form>
  );
}

function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="font-display font-bold text-xl mb-2">Check your inbox!</h2>
        <p className="text-muted-foreground text-sm mb-6">
          We sent a password reset link to <span className="text-blue-400 font-medium">{email}</span>
        </p>
        <Link href="/login" className="text-blue-400 text-sm hover:text-blue-300 transition-colors flex items-center justify-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium">Email address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input id="reset-email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@stu.ucc.edu.gh" className="input-premium pl-10" />
        </div>
      </div>
      <button id="reset-submit" type="submit" disabled={loading}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50">
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
        ) : "Send Reset Link"}
      </button>
      <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2">
        <ArrowLeft className="w-4 h-4" /> Back to Login
      </Link>
    </form>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const { session, loading: authLoading } = useAuth();
  const isRecovery = searchParams.get("recovery") === "1";
  const linkExpired = isRecovery && !authLoading && !session;

  let body: React.ReactNode;
  let title = "Reset Password";
  let subtitle = "Enter your email to receive a reset link";

  if (isRecovery && authLoading) {
    body = (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  } else if (linkExpired) {
    title = "Link Expired";
    subtitle = "This reset link is invalid or has expired";
    body = (
      <div className="text-center py-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm mb-6">Request a new one below.</p>
        <RequestResetForm />
      </div>
    );
  } else if (isRecovery) {
    title = "Set New Password";
    subtitle = "Choose a new password for your account";
    body = <NewPasswordForm />;
  } else {
    body = <RequestResetForm />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="fixed inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-black text-2xl gradient-text">KampusPulse</span>
          </Link>
          <h1 className="font-display font-bold text-3xl text-foreground mb-2">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8">
          {body}
        </motion.div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
