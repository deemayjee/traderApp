"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana"
import { useRouter } from "next/navigation"

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        appearance: {
          accentColor: "#6A6FF5",
          theme: "#222224",
          showWalletLoginFirst: true,
          logo: "https://auth.privy.io/logos/privy-logo-dark.png",
          walletChainType: "solana-only",
          walletList: [
            "phantom",
            "solflare",
            "backpack",
          ]
        },
        loginMethods: ["wallet"],
        embeddedWallets: {
          requireUserPasswordOnCreate: false,
          showWalletUIs: false,
          ethereum: {
            createOnLogin: "off"
          },
          solana: {
            createOnLogin: "off"
          }
        },
        mfa: {
          noPromptOnMfaRequired: false
        },
        externalWallets: {
          solana: {
            connectors: toSolanaWalletConnectors()
          }
        }
      }}
    >
      {children}
    </PrivyProvider>
  )
} 