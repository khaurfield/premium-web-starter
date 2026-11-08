import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { publicEnv } from "@/lib/public-env";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: publicEnv.appName,
    template: `%s | ${publicEnv.appName}`,
  },
  description:
    "A production-oriented Next.js foundation for a personal AI assistant: typed environment, structured logging, real AI provider boundary, database schema and cloud deployment configuration.",
  applicationName: publicEnv.appName,
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
