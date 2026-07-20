import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter, Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificationsProvider } from "@/contexts/notifications-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "KampusPulse – University of Cape Coast Digital Ecosystem",
    template: "%s | KampusPulse",
  },
  description:
    "KampusPulse is the premier digital ecosystem for UCC students — shop on EDWOM, earn with Y3 ADWUMA, and move with EZZYRIDE.",
  keywords: [
    "KampusPulse", "UCC", "University of Cape Coast", "student marketplace",
    "campus delivery", "student tasks", "Ghana", "EDWOM", "EZZYRIDE", "Y3 ADWUMA",
  ],
  authors: [{ name: "KampusPulse" }],
  creator: "KampusPulse",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_GH",
    url: "/",
    title: "KampusPulse – UCC Digital Ecosystem",
    description: "Shop, Earn & Move on UCC's most innovative student platform.",
    siteName: "KampusPulse",
  },
  twitter: {
    card: "summary_large_image",
    title: "KampusPulse",
    description: "UCC's premier digital ecosystem for students.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // next-themes injects a raw inline <script> (before hydration, to avoid a
  // flash of the wrong theme) that the CSP nonce in middleware.ts doesn't
  // reach automatically — it must be passed through explicitly.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <ThemeProvider nonce={nonce} attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <NotificationsProvider>
              {children}
              <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
            </NotificationsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
