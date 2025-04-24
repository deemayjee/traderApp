import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/contexts/notification-context"
import { Toaster } from "@/components/ui/toaster"
import { SolanaWalletProvider } from "@/components/auth/wallet-provider"
import { WalletAuthProvider } from "@/components/auth/wallet-context"

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
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        <SolanaWalletProvider>
          <WalletAuthProvider>
            <NotificationProvider>
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
                {children}
                <Toaster />
              </ThemeProvider>
            </NotificationProvider>
          </WalletAuthProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  )
}
