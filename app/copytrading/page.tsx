"use client"

import { useEffect, useState } from "react"
import { DepositVerification } from "@/components/copytrading/deposit-verification"
import { CopySettings } from "@/components/copytrading/copy-settings"
import { ActiveCopies } from "@/components/copytrading/active-copies"
import { TopTraders } from "@/components/copytrading/top-traders"
import { CopyTradingStats } from "@/components/copytrading/copy-trading-stats"
import { TradeMonitor } from "@/components/copytrading/trade-monitor"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWalletAuth } from "@/hooks/use-wallet-auth"
import { Dialog } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface CopyTrade {
  id: string
  trader_wallet: string
  trader_name: string
  allocation: number
  max_slippage: number
  stop_loss: number
  status: string
}

export default function CopyTradingPage() {
  const { user } = useWalletAuth()
  const [isDepositVerified, setIsDepositVerified] = useState(false)
  const [copiedWallets, setCopiedWallets] = useState<Array<CopyTrade>>([])
  const [selectedTrader, setSelectedTrader] = useState<{ address: string; name: string } | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [editingWallet, setEditingWallet] = useState<CopyTrade | null>(null)
  const [editForm, setEditForm] = useState({ allocation: '', maxSlippage: '', stopLoss: '' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user?.wallet?.address) {
      fetchActiveCopyTrades()
    }
  }, [user?.wallet?.address])

  useEffect(() => {
    if (editingWallet) {
      setEditForm({
        allocation: editingWallet.allocation.toString(),
        maxSlippage: editingWallet.max_slippage.toString(),
        stopLoss: editingWallet.stop_loss.toString(),
      })
    }
  }, [editingWallet])

  const fetchActiveCopyTrades = async () => {
    try {
      console.log("Fetching active copy trades for wallet:", user?.wallet?.address)
      const response = await fetch(`/api/copy-trading/active?userWallet=${user?.wallet?.address}`)
      const data = await response.json()
      console.log("Active copy trades response:", data)

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch active copy trades")
      }

      // Store the full trade object
      setCopiedWallets(data.trades)
      setIsDepositVerified(true)
    } catch (error) {
      console.error("Error fetching active copy trades:", error)
      toast.error("Failed to load active copy trades")
    } finally {
      setIsLoading(false)
    }
  }

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
    // Remove optimistic update to copiedWallets
    setSelectedTrader(null)
    toast.success(`Started copying ${selectedTrader.name} with ${settings.allocation} SOL allocation`)
    // Refetch active copy trades from backend
    fetchActiveCopyTrades()
  }

  const handleEdit = (wallet: { address: string; name: string }) => {
    // Find the full CopyTrade object
    const trade = copiedWallets.find(t => t.trader_wallet === wallet.address)
    if (trade) setEditingWallet(trade)
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value })
  }

  const handleEditSave = async () => {
    if (!editingWallet) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/copy-trading/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingWallet.id,
          allocation: parseFloat(editForm.allocation),
          maxSlippage: parseFloat(editForm.maxSlippage),
          stopLoss: parseFloat(editForm.stopLoss),
        })
      })
      if (!response.ok) throw new Error('Failed to update copy trade')
      toast.success('Copy trade updated!')
      setEditingWallet(null)
      fetchActiveCopyTrades()
    } catch (err) {
      toast.error('Failed to update copy trade')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Copy Trading</h1>
      
      {!isDepositVerified && !user?.wallet?.address ? (
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monitor">Trade Monitor</TabsTrigger>
            <TabsTrigger value="traders">Top Traders</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setSelectedTrader({ address: '', name: '' })}>
                Start Copy Trading
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CopyTradingStats />
              <ActiveCopies
                wallets={copiedWallets.map(trade => ({ address: trade.trader_wallet, name: trade.trader_name }))}
                onEdit={handleEdit}
              />
            </div>
          </TabsContent>

          <TabsContent value="monitor" className="space-y-6">
            {copiedWallets.length > 0 ? (
              copiedWallets.map((trade: CopyTrade) => {
                console.log("Rendering trade monitor for trade:", trade)
                return (
                  <TradeMonitor
                    key={trade.trader_wallet}
                    traderAddress={trade.trader_wallet}
                    allocation={trade.allocation}
                    maxSlippage={trade.max_slippage}
                    stopLoss={trade.stop_loss}
                  />
                )
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No active copy trades found</p>
                <p className="text-sm text-muted-foreground mt-2">Copied wallets count: {copiedWallets.length}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="traders">
            <TopTraders />
          </TabsContent>
        </Tabs>
      )}

      {/* Edit Modal */}
      {editingWallet && (
        <Dialog open={!!editingWallet} onOpenChange={open => !open && setEditingWallet(null)}>
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Edit Copy Trade</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="allocation">Allocation (SOL)</Label>
                  <Input
                    id="allocation"
                    name="allocation"
                    type="number"
                    min="0"
                    value={editForm.allocation}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div>
                  <Label htmlFor="maxSlippage">Max Slippage (%)</Label>
                  <Input
                    id="maxSlippage"
                    name="maxSlippage"
                    type="number"
                    min="0"
                    value={editForm.maxSlippage}
                    onChange={handleEditFormChange}
                  />
                </div>
                <div>
                  <Label htmlFor="stopLoss">Stop Loss (%)</Label>
                  <Input
                    id="stopLoss"
                    name="stopLoss"
                    type="number"
                    min="0"
                    value={editForm.stopLoss}
                    onChange={handleEditFormChange}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setEditingWallet(null)} disabled={isSaving}>Cancel</Button>
                <Button onClick={handleEditSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  )
}
