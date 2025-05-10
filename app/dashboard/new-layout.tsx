import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { TopPerformers } from "@/components/dashboard/top-performers"
import { PriceChart } from "@/components/dashboard/price-chart"
import { CommunitySignals } from "@/components/dashboard/community-signals"
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview"
import { TradingAlerts } from "@/components/dashboard/trading-alerts"
import { AiInsights } from "@/components/dashboard/ai-insights"
import { useWalletTokens } from "@/hooks/use-wallet-tokens"
import { Loader2 } from "lucide-react"

export default function DashboardNewLayout() {
  const { assets, isLoading } = useWalletTokens();
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <DashboardHeader />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 space-y-6">
              <PriceChart />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TopPerformers />
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                  </div>
                ) : (
                  <PortfolioOverview assets={assets} />
                )}
              </div>
              <CommunitySignals />
            </div>
            <div className="space-y-6">
              <AiInsights />
              <TradingAlerts />
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
