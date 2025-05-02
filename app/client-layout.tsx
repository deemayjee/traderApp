"use client"

import * as React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { NotificationProvider } from "@/contexts/notification-context"
import { Toaster } from "@/components/ui/toaster"
import { PrivyProvider } from "@privy-io/react-auth"
import { Navbar } from "@/components/navbar"
import { UserProfileProvider } from "@/contexts/user-profile-context"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
        config={{
          loginMethods: ["wallet"],
          appearance: {
            theme: "light",
            accentColor: "#676FFF",
            showWalletLoginFirst: true,
          },
          embeddedWallets: {
            createOnLogin: "users-without-wallets",
          }
        }}
      >
        <UserProfileProvider>
          <Navbar />
          <NotificationProvider>
            {children}
            <Toaster />
          </NotificationProvider>
        </UserProfileProvider>
      </PrivyProvider>
    </ThemeProvider>
  )
} 