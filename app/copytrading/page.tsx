"use client"

import { useState } from "react"
import { DepositVerification } from "@/components/copytrading/deposit-verification"
import { CopySettings } from "@/components/copytrading/copy-settings"
import { ActiveCopies } from "@/components/copytrading/active-copies"
import { TopTraders } from "@/components/copytrading/top-traders"
import { CopyTradingStats } from "@/components/copytrading/copy-trading-stats"
import { toast } from "sonner"

export default function CopyTradingPage() {
  const [isDepositVerified, setIsDepositVerified] = useState(false)
  const [copiedWallets, setCopiedWallets] = useState<Array<{ address: string; name: string }>>([])
  const [selectedTrader, setSelectedTrader] = useState<{ address: string; name: string } | null>(null)

  const handleDepositVerified = () => {
    console.log("Deposit verified")
    setIsDepositVerified(true)
  }

  const handleWalletAdded = (walletAddress: string, walletName: string) => {
    console.log("Wallet added:", { walletAddress, walletName })
    setSelectedTrader({ address: walletAddress, name: walletName })
  }

  const handleSettingsSaved = (settings: {
    allocation: number
    maxSlippage: number
    stopLoss: number
  }) => {
    if (!selectedTrader) return

    console.log("Settings saved:", { selectedTrader, settings })
    // Add the trader to the list of copied wallets
    setCopiedWallets([...copiedWallets, selectedTrader])
    setSelectedTrader(null)
    
    toast.success(`Started copying ${selectedTrader.name} with ${settings.allocation} SOL allocation`)
  }

  console.log("Current state:", { isDepositVerified, selectedTrader, copiedWallets })

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Copy Trading</h1>
      
      {!isDepositVerified ? (
        <DepositVerification
          onDepositVerified={handleDepositVerified}
          onWalletAdded={handleWalletAdded}
        />
      ) : selectedTrader ? (
        <CopySettings
          traderWallet={selectedTrader.address}
          traderName={selectedTrader.name}
          onSettingsSaved={handleSettingsSaved}
        />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CopyTradingStats />
            <ActiveCopies wallets={copiedWallets} />
          </div>
          
          <TopTraders />
        </div>
      )}
    </div>
  )
}
