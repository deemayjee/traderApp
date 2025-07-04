import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { WalletProvider } from "@/components/auth/wallet-provider"
import { WalletAuthProvider } from "@/components/auth/wallet-context"
import { UserProfileProvider } from "@/contexts/user-profile-context"
import { AuthProvider } from "@/components/auth/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PallyTraders | Autonomous Trading AI",
  description: "Train and deploy AI agents for autonomous trading on Hyperliquid. Advanced machine learning for superior trading performance.",
  generator: 'PallyTraders',
  keywords: "AI trading, autonomous trading, machine learning, algorithmic trading, Hyperliquid, trading bots, AI agents",
  authors: [{ name: "PallyTraders Team" }],
  openGraph: {
    title: "PallyTraders | Autonomous Trading AI",
    description: "Train and deploy AI agents for autonomous trading on Hyperliquid",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased dark`}>
        <WalletProvider>
          <WalletAuthProvider>
            <AuthProvider>
              <UserProfileProvider>
                <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
                  {children}
                  <Toaster />
                </ThemeProvider>
              </UserProfileProvider>
            </AuthProvider>
          </WalletAuthProvider>
        </WalletProvider>
      </body>
    </html>
  )
}
