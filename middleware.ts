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

  if (user && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
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
