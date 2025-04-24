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

export default function DashboardNewLayout() {
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
                <PortfolioOverview />
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
