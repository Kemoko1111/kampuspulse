import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PRIVATE_ROUTES = [
  "/home", "/edwom/cart", "/edwom/checkout", "/edwom/orders",
  "/y3adwuma/post-task", "/messages", "/notifications", "/profile", "/settings", "/admin", "/rider",
];

const ADMIN_ROUTES = ["/admin"];
const RIDER_ROUTES = ["/rider"];
const AUTH_ROUTES = ["/login", "/register", "/reset-password"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
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
      return NextResponse.redirect(new URL("/admin", request.url));
    } else if (profile?.role === "rider") {
      return NextResponse.redirect(new URL("/rider", request.url));
    }
    return NextResponse.redirect(new URL("/home", request.url));
  }

  const isPrivate = PRIVATE_ROUTES.some((r) => pathname.startsWith(r));
  if (!user && isPrivate) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
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
      return NextResponse.redirect(url);
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
      return NextResponse.redirect(new URL("/home", request.url));
    }
    if (RIDER_ROUTES.some((r) => pathname.startsWith(r)) && profile?.role !== "rider" && profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
