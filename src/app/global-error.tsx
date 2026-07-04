"use client";

import { useEffect } from "react";

// error.tsx doesn't catch errors thrown by the root layout itself (fonts,
// providers, etc.) — this is the one Next.js requires for that case, and it
// has to render its own <html>/<body> since it replaces the whole root
// layout when it fires.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled root layout error:", error);
  }, [error]);

  return (
    <html>
      <body style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something went wrong</h1>
          <p style={{ color: "#888", marginBottom: "1.5rem" }}>{error.message || "An unexpected error occurred."}</p>
          <button
            onClick={reset}
            style={{ background: "#3b82f6", color: "white", border: "none", borderRadius: "0.75rem", padding: "0.75rem 1.5rem", cursor: "pointer", fontWeight: 600 }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
