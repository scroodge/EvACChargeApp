import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0b1324",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "EV Charge Pulse",
    template: "%s · EV Charge Pulse",
  },
  description:
    "Realtime EV charging progress, timers, energy, and cost — mobile-first tracker.",
  applicationName: "EV Charge Pulse",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Charge Pulse",
  },
  icons: {
    icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="bg-background font-sans min-h-dvh text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
