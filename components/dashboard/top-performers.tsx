import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, MoreHorizontal } from "lucide-react"
import type { FormattedCryptoAsset } from "@/lib/api/crypto-api"

interface TopPerformersProps {
  topCoins: FormattedCryptoAsset[]
}

export function TopPerformers({ topCoins }: TopPerformersProps) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Top Performers (24h)</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>View all</DropdownMenuItem>
            <DropdownMenuItem>Sort by price</DropdownMenuItem>
            <DropdownMenuItem>Sort by change</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topCoins.map((coin) => (
            <div key={coin.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
              <div className="flex items-center space-x-3">
                <img src={coin.image || "/placeholder.svg"} alt={coin.name} className="w-8 h-8 rounded-full" />
                <div>
                  <p className="font-medium text-sm">{coin.name}</p>
                  <p className="text-xs text-gray-500">{coin.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm">${coin.price}</p>
                <p
                  className={`text-xs flex items-center justify-end ${coin.positive ? "text-green-600" : "text-red-600"}`}
                >
                  {coin.positive ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
                  {coin.change}
                </p>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full mt-2 border-gray-200">
            View All Markets
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
