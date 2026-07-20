import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PRIVATE_ROUTES = [
  "/home", "/edwom/cart", "/edwom/checkout", "/edwom/orders", "/edwom/sell",
  "/y3adwuma/post-task", "/messages", "/notifications", "/profile", "/settings", "/admin", "/rider",
];

const ADMIN_ROUTES = ["/admin"];
const RIDER_ROUTES = ["/rider"];
const AUTH_ROUTES = ["/login", "/register", "/reset-password"];

// script-src previously allowed 'unsafe-inline'/'unsafe-eval', which defeats
// CSP's XSS protection entirely — any injected inline script or eval-based
// payload would run despite the header being present. Neither is actually
// needed: the app has no dangerouslySetInnerHTML/inline <script> anywhere,
// and Paystack checkout is a full-page redirect (never loads Paystack's
// client-side JS), so a nonce + 'strict-dynamic' policy (Next.js's
// documented approach — https://nextjs.org/docs/app/guides/content-security-policy)
// covers Next's own bootstrap/RSC scripts without reopening either hole.
// 'unsafe-eval' is kept in development only, since `next dev`'s Fast Refresh
// relies on eval-wrapped modules; production never includes it.
function buildCspHeader(nonce: string): string {
  const isDev = process.env.NODE_ENV !== "production";
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""} https://js.paystack.co`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob: https:`,
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paystack.co https://fcm.googleapis.com https://*.tile.openstreetmap.org https://nominatim.openstreetmap.org https://router.project-osrm.org`,
    `frame-src https://js.paystack.co`,
  ].join("; ") + ";";
}

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = buildCspHeader(nonce);
  request.headers.set("x-nonce", nonce);
  request.headers.set("Content-Security-Policy", cspHeader);

  // Every response this middleware can return — redirects included — carries
  // the same CSP header, so the policy can't be bypassed by hitting a code
  // path that forgot to set it.
  function withCsp<T extends NextResponse>(response: T): T {
    response.headers.set("Content-Security-Policy", cspHeader);
    return response;
  }

  let supabaseResponse = withCsp(NextResponse.next({ request }));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = withCsp(NextResponse.next({ request }));
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  // A password-recovery link authenticates the user and lands them back on
  // /reset-password on purpose — the "already logged in, bounce off auth
  // pages" rule below would otherwise redirect them away before they can
  // actually set a new password. See resetPassword() in auth-context.tsx.
  const isPasswordRecovery = pathname.startsWith("/reset-password") && request.nextUrl.searchParams.get("recovery") === "1";

  if (user && !isPasswordRecovery && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role === "admin") {
      return withCsp(NextResponse.redirect(new URL("/admin", request.url)));
    } else if (profile?.role === "rider") {
      return withCsp(NextResponse.redirect(new URL("/rider", request.url)));
    }
    return withCsp(NextResponse.redirect(new URL("/home", request.url)));
  }

  const isPrivate = PRIVATE_ROUTES.some((r) => pathname.startsWith(r));
  if (!user && isPrivate) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return withCsp(NextResponse.redirect(loginUrl));
  }

  // Bounce suspended/banned users off private pages (the API layer blocks
  // their actions too, in requireProfile). Previously the status was written
  // by admins but never enforced anywhere.
  if (user && isPrivate) {
    const { data: statusRow } = await supabase
      .from("profiles")
      .select("status")
      .eq("user_id", user.id)
      .single();
    const status = (statusRow as { status?: string } | null)?.status;
    if (status === "suspended" || status === "banned") {
      const url = new URL("/login", request.url);
      url.searchParams.set(
        "error",
        status === "banned"
          ? "Your account has been banned. Contact support."
          : "Your account is suspended. Contact support."
      );
      return withCsp(NextResponse.redirect(url));
    }
  }

  if (user && (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) ||
    RIDER_ROUTES.some((r) => pathname.startsWith(r)))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (ADMIN_ROUTES.some((r) => pathname.startsWith(r)) && profile?.role !== "admin") {
      return withCsp(NextResponse.redirect(new URL("/home", request.url)));
    }
    if (RIDER_ROUTES.some((r) => pathname.startsWith(r)) && profile?.role !== "rider" && profile?.role !== "admin") {
      return withCsp(NextResponse.redirect(new URL("/home", request.url)));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
