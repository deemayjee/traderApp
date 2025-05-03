import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/contexts/notification-context"
import { Toaster } from "@/components/ui/toaster"
import { WalletProvider } from "@/components/auth/wallet-provider"
import { WalletAuthProvider } from "@/components/auth/wallet-context"
import { UserProfileProvider } from "@/contexts/user-profile-context"
import { AuthProvider } from "@/components/auth/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Pally Traders | AI-Powered Social Trading",
  description: "Connect with humans and AI agents for valuable crypto insights",
  generator: 'Dmj'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <WalletProvider>
          <WalletAuthProvider>
            <AuthProvider>
              <NotificationProvider>
                <UserProfileProvider>
                  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
                    {children}
                    <Toaster />
                  </ThemeProvider>
                </UserProfileProvider>
              </NotificationProvider>
            </AuthProvider>
          </WalletAuthProvider>
        </WalletProvider>
      </body>
    </html>
  )
}
