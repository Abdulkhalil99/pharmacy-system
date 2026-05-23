import type { Metadata } from "next";
import { Inter, Noto_Naskh_Arabic } from "next/font/google";
import { cookies } from "next/headers";
import type { Locale } from "@pharmacy/shared";
import { RTL_LOCALES } from "@pharmacy/shared";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

// ─── Fonts ─────────────────────────────────────────────────────────────────
// Inter: Latin characters (English interface)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

// Noto Naskh Arabic: Renders Dari & Pashto correctly
// Both languages use the Perso-Arabic script
const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// ─── Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "سیستم مدیریت دارخانه | Pharmacy Management System",
    template: "%s | PMS",
  },
  description: "سیستم مدیریت دارخانه — Pharmacy Management System",
};

// ─── Helper: Get current locale from cookie ────────────────────────────────
// The locale is stored in a cookie so it persists across page reloads
// and is available on the server (unlike localStorage)
async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("PHARMACY_LOCALE");
  const locale = localeCookie?.value as Locale;

  const validLocales: Locale[] = ["fa", "ps", "en"];
  return validLocales.includes(locale) ? locale : "fa"; // Default: Dari
}

// ─── Root Layout ───────────────────────────────────────────────────────────
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  // Determine text direction
  // Dari (fa) and Pashto (ps) are RTL; English (en) is LTR
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  // Map locale to BCP 47 language tag for the HTML lang attribute
  // This helps screen readers and search engines understand the content
  const langMap: Record<Locale, string> = {
    fa: "fa-AF", // Dari as spoken in Afghanistan
    ps: "ps-AF", // Pashto as spoken in Afghanistan
    en: "en",
  };

  return (
    <html
      lang={langMap[locale]}
      dir={dir}
      className={`${inter.variable} ${notoNaskhArabic.variable}`}
      suppressHydrationWarning // Prevents mismatch warning when locale changes
    >
      <body
        className={`
          min-h-screen bg-gray-50 text-gray-900
          antialiased
          ${dir === "rtl" ? "font-arabic" : "font-latin"}
        `}
      >
        {/*
          Providers will wrap children here:
          - QueryClientProvider (React Query)
          - AuthProvider (JWT context)
          - ThemeProvider (future dark mode)
        */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
