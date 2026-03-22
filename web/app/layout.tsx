import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Fira_Code, Source_Code_Pro } from "next/font/google";

// ─── Fonts ────────────────────────────────────────────────────────────────────

const sansFont = Source_Code_Pro({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

const monoFont = Fira_Code({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
  preload: true,
});

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "Sentinel — Chess Integrity",
    template: "%s | Sentinel",
  },
  description:
    "Real-time chess integrity risk assessment and anti-cheat dashboard powered by statistical analysis.",
  keywords: ["chess", "anti-cheat", "integrity", "risk assessment", "arbiter"],
  authors: [{ name: "Sentinel" }],
  robots: { index: false, follow: false }, // Internal tool — keep out of search engines
  openGraph: {
    title: "Sentinel Anti-Cheat",
    description: "Chess integrity risk assessment dashboard",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
  width: "device-width",
  initialScale: 1,
};

// ─── Layout ───────────────────────────────────────────────────────────────────

const fontVariables = [sansFont.variable, monoFont.variable].join(" ");

import AppLayout from '@/components/AppLayout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontVariables} antialiased`}>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
