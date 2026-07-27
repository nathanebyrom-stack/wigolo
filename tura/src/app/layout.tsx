import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";

import "./globals.css";
import "leaflet/dist/leaflet.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TURA — adventure planner for two",
    template: "%s · TURA",
  },
  description:
    "A mobile-first adventure planner for two adults. Camping, coast, mountains, forests and lakes — three quarters of it within reach of a Friday evening.",
  applicationName: "TURA",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "TURA",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0c130f" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  // Extends the app under the notch and home indicator on iPhone.
  viewportFit: "cover",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en-GB"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable} h-full`}
    >
      <body className="min-h-dvh">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
