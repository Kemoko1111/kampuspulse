import { cookies } from "next/headers";
import { timingSafeEqual } from "crypto";
import { AppError } from "@/lib/errors/app-error";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

export async function generateCsrfToken(): Promise<string> {
  const token = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 3600,
  });
  return token;
}

export async function validateCsrf(request: Request) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_HEADER);

  // timingSafeEqual over a plain !== to avoid leaking how many leading
  // characters matched, same rationale as the Paystack webhook signature
  // check. Both tokens are fixed-length UUIDs so the length check itself
  // doesn't leak anything useful.
  const cookieBuffer = Buffer.from(cookieToken ?? "");
  const headerBuffer = Buffer.from(headerToken ?? "");
  const tokensMatch =
    !!cookieToken &&
    !!headerToken &&
    cookieBuffer.length === headerBuffer.length &&
    timingSafeEqual(cookieBuffer, headerBuffer);

  if (!tokensMatch) {
    throw new AppError("Invalid CSRF token", 403, "CSRF_INVALID");
  }
}
