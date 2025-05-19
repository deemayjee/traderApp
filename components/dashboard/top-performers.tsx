import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, MoreHorizontal } from "lucide-react"
import type { FormattedCryptoAsset } from "@/lib/api/crypto-api"

interface TopPerformersProps {
  topCoins: FormattedCryptoAsset[]
}

const PallyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 81.64 105.02" width={32} height={32} style={{marginRight: 8}}>
    <title>Pally Icon</title>
    <path d="M56.88 28.57c-6.45 0-12.89-.07-19.34 0-9.34.15-16.79-3.57-22.06-11.19a24.63 24.63 0 0 1-4.16-15.82c.06-1 .49-1.49 1.51-1.48S15 .05 16 .05c13.71 0 27.42-.16 41.12.09 10.6.19 19.26 6.26 23 16.5a25.11 25.11 0 0 1 1.43 9.76c-.06 1.59-.54 2.19-2.19 2.18-7.52-.07-15 0-22.54 0z" fill="#fbbd43"/>
    <path d="M33.69 60.47c-.43.11-.56.41-.57.84a156.34 156.34 0 0 1-1.65 16.59 29.82 29.82 0 0 1-7 15.29 32.87 32.87 0 0 1-17.6 11.12 41.46 41.46 0 0 1-5 .68c-1.58.21-2-.63-1.8-2 .52-4.53 1-9.06 1.52-13.59.79-7.47 1.61-14.92 2.5-22.4.64-5.38 1-10.86 3.42-15.84C13 40.07 21.83 33.5 34.28 32.08a6.79 6.79 0 0 1 1.47.18c-.41 7-1.91 13.94-2.13 21-.08 2.38-.94 4.81.07 7.21z" fill="#1ea9e1"/>
    <path d="M33.69 60.47c-1-2.4-.15-4.83-.07-7.24.22-7 1.72-13.94 2.13-21 14.12-.49 28.25-.09 42.37-.21 2.87 0 3 .07 2.35 2.83-3.09 12.9-11.19 20.95-23.81 24.6-3.66 1.06-7.41 1-11.15 1z" fill="#fbbd43"/>
  </svg>
)

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
            <div key={coin.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900">
              <div className="flex items-center space-x-3">
                <PallyIcon />
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
