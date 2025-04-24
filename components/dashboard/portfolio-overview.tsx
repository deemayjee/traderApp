import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { PortfolioAsset } from "@/lib/api/crypto-api"
import Link from "next/link"

interface PortfolioOverviewProps {
  assets: PortfolioAsset[]
}

export function PortfolioOverview({ assets }: PortfolioOverviewProps) {
  // Calculate total portfolio value
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0)

  // Calculate 24h change
  const change24h = assets.reduce((sum, asset) => {
    const assetChange = asset.value * (asset.changePercent / 100)
    return sum + assetChange
  }, 0)

  const changePercent24h = (change24h / (totalValue - change24h)) * 100
  const isPositive = changePercent24h > 0

  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Portfolio Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold">
              ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? "+" : ""}$
              {Math.abs(change24h).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (
              {isPositive ? "+" : ""}
              {changePercent24h.toFixed(1)}%)
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {assets.map((asset) => (
            <div key={asset.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <img src={asset.image || "/placeholder.svg"} alt={asset.name} className="w-6 h-6 rounded-full" />
                  <p className="font-medium text-sm">{asset.name}</p>
                  <p className="text-xs text-gray-500">{asset.formattedAmount}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">${asset.formattedValue}</p>
                  <p
                    className={`text-xs flex items-center justify-end ${asset.positive ? "text-green-600" : "text-red-600"}`}
                  >
                    {asset.positive ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
                    {asset.change}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Progress value={asset.allocation} className="h-1" />
                <span className="text-xs text-gray-500">{asset.allocation}%</span>
              </div>
            </div>
          ))}
        </div>

        <Link href="/dashboard/portfolio">
          <Button variant="outline" size="sm" className="w-full mt-4 border-gray-200">
            View Full Portfolio
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
