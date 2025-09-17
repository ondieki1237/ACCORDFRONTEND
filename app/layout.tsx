import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import QueryProvider from "../components/QueryProvider"

export const metadata: Metadata = {
  title: "ACCORD Business Management",
  description: "Mobile-first business management app for field sales teams",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ACCORD",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/accord-icon.png",
    apple: "/accord-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#00aeef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ACCORD" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#00aeef" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/accord-icon.png" />
        <link
          rel="mask-icon"
          href="/accord-icon.png"
          color="#00aeef"
        />
        <link rel="icon" href="/accord-icon.png" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <QueryProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  )
}