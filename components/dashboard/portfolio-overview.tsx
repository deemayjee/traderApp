import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import type { ProcessedTokenAccount } from "@/hooks/use-wallet-tokens"
import Link from "next/link"

interface PortfolioOverviewProps {
  assets: ProcessedTokenAccount[]
}

const PallyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 81.64 105.02" width={24} height={24} style={{marginRight: 8}}>
    <title>Pally Icon</title>
    <path d="M56.88 28.57c-6.45 0-12.89-.07-19.34 0-9.34.15-16.79-3.57-22.06-11.19a24.63 24.63 0 0 1-4.16-15.82c.06-1 .49-1.49 1.51-1.48S15 .05 16 .05c13.71 0 27.42-.16 41.12.09 10.6.19 19.26 6.26 23 16.5a25.11 25.11 0 0 1 1.43 9.76c-.06 1.59-.54 2.19-2.19 2.18-7.52-.07-15 0-22.54 0z" fill="#fbbd43"/>
    <path d="M33.69 60.47c-.43.11-.56.41-.57.84a156.34 156.34 0 0 1-1.65 16.59 29.82 29.82 0 0 1-7 15.29 32.87 32.87 0 0 1-17.6 11.12 41.46 41.46 0 0 1-5 .68c-1.58.21-2-.63-1.8-2 .52-4.53 1-9.06 1.52-13.59.79-7.47 1.61-14.92 2.5-22.4.64-5.38 1-10.86 3.42-15.84C13 40.07 21.83 33.5 34.28 32.08a6.79 6.79 0 0 1 1.47.18c-.41 7-1.91 13.94-2.13 21-.08 2.38-.94 4.81.07 7.21z" fill="#1ea9e1"/>
    <path d="M33.69 60.47c-1-2.4-.15-4.83-.07-7.24.22-7 1.72-13.94 2.13-21 14.12-.49 28.25-.09 42.37-.21 2.87 0 3 .07 2.35 2.83-3.09 12.9-11.19 20.95-23.81 24.6-3.66 1.06-7.41 1-11.15 1z" fill="#fbbd43"/>
  </svg>
)

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
            <div key={asset.mint} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <PallyIcon />
                  <p className="font-medium text-sm">{asset.metadata?.name || (asset.mint ? asset.mint.slice(0, 6) + '...' : 'Unknown')}</p>
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
