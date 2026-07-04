"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

// Without this file, ANY uncaught client-side exception anywhere in the app
// crashed to Next.js's generic "Application error" screen with no way to
// retry or even tell which page/action caused it — exactly what made
// tonight's crashes (notifications, admin role sync) hard to diagnose from
// the outside. This catches render-time errors in any page under the root
// layout and shows a real retry UI instead.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center glass-card p-8">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="font-display font-bold text-xl mb-2">Something went wrong</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary flex items-center justify-center gap-2 px-6 py-3"
          >
            <RefreshCcw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/home"
            className="flex items-center justify-center gap-2 glass border border-white/10 rounded-xl px-6 py-3 text-sm font-medium hover:bg-white/5 transition-all"
          >
            <Home className="w-4 h-4" /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
