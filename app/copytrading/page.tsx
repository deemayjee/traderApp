import { CopyTradingHeader } from "@/components/copytrading/copytrading-header"
import { ConnectedWallets } from "@/components/copytrading/connected-wallets"
import { ActiveCopies } from "@/components/copytrading/active-copies"
import { CopyTradingStats } from "@/components/copytrading/copytrading-stats"

export default function CopyTrading() {
  return (
    <>
      <CopyTradingHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <ActiveCopies />
        </div>
        <div className="space-y-6">
          <CopyTradingStats />
          <ConnectedWallets />
        </div>
      </div>
    </>
  )
}
