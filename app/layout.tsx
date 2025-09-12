import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import QueryProvider from "../components/QueryProvider"

export const metadata: Metadata = {
  title: "ACORD Business Management",
  description: "Mobile-first business management app for field sales teams",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ACORD",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/acord-app-icon-blue.jpg",
    apple: "/acord-app-icon-blue.jpg",
  },
}

// ✅ Move viewport + themeColor here
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
        <meta name="apple-mobile-web-app-title" content="ACORD" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#00aeef" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/acord-app-icon-blue.jpg" />
        <link
          rel="mask-icon"
          href="/acord-app-icon-blue.jpg"
          color="#00aeef"
        />
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
