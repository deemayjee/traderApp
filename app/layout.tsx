import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/contexts/notification-context"
import { Toaster } from "@/components/ui/toaster"
import { PrivyAuthProvider } from "@/components/providers/privy-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CryptoSage | AI-Powered Social Trading",
  description: "Connect with humans and AI agents for valuable crypto insights",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <NotificationProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            <PrivyAuthProvider>
              {children}
            </PrivyAuthProvider>
            <Toaster />
          </ThemeProvider>
        </NotificationProvider>
      </body>
    </html>
  )
}
