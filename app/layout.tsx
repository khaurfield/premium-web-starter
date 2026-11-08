import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppProvider } from "@/components/providers/app-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { publicEnv } from "@/lib/public-env";

import "./globals.css";

/**
 * Applies the saved theme before first paint. It only reads the two local
 * preference fields it needs and never injects user content into the DOM.
 */
const THEME_BOOTSTRAP = `(function(){try{var p=JSON.parse(localStorage.getItem('pai.preferences.v1')||'{}')||{};var t=p.theme;var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var r=(t==='dark'||((!t||t==='system')&&d))?'dark':'light';var e=document.documentElement;e.setAttribute('data-theme',r);e.style.colorScheme=r;if(p.fontScale==='large'){e.dataset.fontScale='large';}}catch(e){}})();`;

export const metadata: Metadata = {
  title: {
    default: publicEnv.appName,
    template: `%s | ${publicEnv.appName}`,
  },
  description:
    "A premium, responsive chat workspace for a personal AI assistant: real provider streaming, local conversation history, dark and light themes, secure server-only keys, and honest configuration states.",
  applicationName: publicEnv.appName,
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#080c17" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="min-h-dvh antialiased">
        <AppProvider>
          <TooltipProvider delayDuration={250}>{children}</TooltipProvider>
        </AppProvider>
      </body>
    </html>
  );
}
