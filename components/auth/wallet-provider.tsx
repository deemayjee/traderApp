"use client"

import { PrivyProvider } from "@privy-io/react-auth"
import { useRouter } from "next/navigation"

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        appearance: {
          accentColor: "#68fff9", // Hyperliquid brand color
          theme: "#222224",
          showWalletLoginFirst: true,
          logo: "https://auth.privy.io/logos/privy-logo-dark.png",
          walletChainType: "ethereum-only",
          walletList: [
            "phantom",
            "metamask",
            "coinbase_wallet",
            "rainbow",
            "wallet_connect"
          ]
        },
        loginMethods: ["wallet"],
        embeddedWallets: {
          requireUserPasswordOnCreate: false,
          showWalletUIs: false,
          ethereum: {
            createOnLogin: "off"
          }
        },
        mfa: {
          noPromptOnMfaRequired: false
        },
        supportedChains: [
          {
            id: 999, // Hyperliquid EVM Chain ID
            name: "Hyperliquid EVM",
            network: "hyperliquid",
            nativeCurrency: {
              name: "HYPE",
              symbol: "HYPE",
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ["https://rpc.hyperliquid.xyz/evm"],
              },
              public: {
                http: ["https://rpc.hyperliquid.xyz/evm"],
              },
            },
            blockExplorers: {
              default: {
                name: "Hyperliquid Explorer",
                url: "https://hyperfoundation.org",
              },
            },
          },
        ]
      }}
    >
      {children}
    </PrivyProvider>
  )
} 