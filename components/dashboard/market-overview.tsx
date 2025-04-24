import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp } from "lucide-react"
import type { FormattedCryptoAsset } from "@/lib/api/crypto-api"

interface MarketOverviewProps {
  marketData: FormattedCryptoAsset[]
  className?: string
}

export function MarketOverview({ marketData, className = "" }: MarketOverviewProps) {
  if (!marketData || marketData.length === 0) {
    return (
      <Card className={`bg-white border-gray-200 ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">No market data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-white border-gray-200 ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="text-gray-600">Asset</TableHead>
              <TableHead className="text-gray-600">Price</TableHead>
              <TableHead className="text-gray-600">24h Change</TableHead>
              <TableHead className="text-gray-600 hidden md:table-cell">Market Cap</TableHead>
              <TableHead className="text-gray-600 hidden md:table-cell">Volume</TableHead>
              <TableHead className="text-gray-600">AI Sentiment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {marketData.map((asset) => (
              <TableRow key={asset.id} className="border-gray-200">
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <img
                      src={asset.image || "/placeholder.svg"}
                      alt={asset.name}
                      className="w-6 h-6 mr-2 rounded-full"
                    />
                    {asset.name} <span className="text-gray-500 ml-1">{asset.symbol}</span>
                  </div>
                </TableCell>
                <TableCell>${asset.price}</TableCell>
                <TableCell className={asset.positive ? "text-green-600" : "text-red-600"}>
                  <div className="flex items-center">
                    {asset.positive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {asset.change}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">${asset.marketCap}</TableCell>
                <TableCell className="hidden md:table-cell">${asset.volume}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`
                      ${
                        asset.sentiment === "Bullish"
                          ? "border-green-200 text-green-600"
                          : asset.sentiment === "Bearish"
                            ? "border-red-200 text-red-600"
                            : "border-gray-300 text-gray-600"
                      }
                    `}
                  >
                    {asset.sentiment}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
