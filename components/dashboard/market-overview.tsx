import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp } from "lucide-react"
import type { FormattedCryptoAsset } from "@/lib/api/crypto-api"

interface MarketOverviewProps {
  marketData: FormattedCryptoAsset[]
  className?: string
  onTokenSelect?: (token: FormattedCryptoAsset) => void
}

const PallyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 81.64 105.02" width={24} height={24} style={{marginRight: 8}}>
    <title>Pally Icon</title>
    <path d="M56.88 28.57c-6.45 0-12.89-.07-19.34 0-9.34.15-16.79-3.57-22.06-11.19a24.63 24.63 0 0 1-4.16-15.82c.06-1 .49-1.49 1.51-1.48S15 .05 16 .05c13.71 0 27.42-.16 41.12.09 10.6.19 19.26 6.26 23 16.5a25.11 25.11 0 0 1 1.43 9.76c-.06 1.59-.54 2.19-2.19 2.18-7.52-.07-15 0-22.54 0z" fill="#fbbd43"/>
    <path d="M33.69 60.47c-.43.11-.56.41-.57.84a156.34 156.34 0 0 1-1.65 16.59 29.82 29.82 0 0 1-7 15.29 32.87 32.87 0 0 1-17.6 11.12 41.46 41.46 0 0 1-5 .68c-1.58.21-2-.63-1.8-2 .52-4.53 1-9.06 1.52-13.59.79-7.47 1.61-14.92 2.5-22.4.64-5.38 1-10.86 3.42-15.84C13 40.07 21.83 33.5 34.28 32.08a6.79 6.79 0 0 1 1.47.18c-.41 7-1.91 13.94-2.13 21-.08 2.38-.94 4.81.07 7.21z" fill="#1ea9e1"/>
    <path d="M33.69 60.47c-1-2.4-.15-4.83-.07-7.24.22-7 1.72-13.94 2.13-21 14.12-.49 28.25-.09 42.37-.21 2.87 0 3 .07 2.35 2.83-3.09 12.9-11.19 20.95-23.81 24.6-3.66 1.06-7.41 1-11.15 1z" fill="#fbbd43"/>
  </svg>
)

// Utility to format large numbers (e.g., 1.5B, 3.2M)
function formatLargeNumber(num: number | string | undefined | null) {
  if (num === null || num === undefined || num === "") return '-';
  // If it's a string and already contains a suffix, return as is
  if (typeof num === 'string') {
    const trimmed = num.trim();
    if (/^[\d,.]+[KMBT]$/.test(trimmed)) return trimmed; // Already formatted
    if (!isNaN(Number(trimmed))) num = Number(trimmed);
    else return trimmed;
  }
  if (typeof num !== 'number' || isNaN(num)) return '-';
  if (Math.abs(num) >= 1.0e+12) return (num / 1.0e+12).toFixed(2) + "T";
  if (Math.abs(num) >= 1.0e+9) return (num / 1.0e+9).toFixed(2) + "B";
  if (Math.abs(num) >= 1.0e+6) return (num / 1.0e+6).toFixed(2) + "M";
  if (Math.abs(num) >= 1.0e+3) return (num / 1.0e+3).toFixed(2) + "K";
  return num.toString();
}

export function MarketOverview({ marketData, className = "", onTokenSelect }: MarketOverviewProps) {
  if (!marketData || marketData.length === 0) {
    return (
      <Card className={`bg-background border-border ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">No market data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-background border-border ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">Asset</TableHead>
              <TableHead className="text-muted-foreground">Price</TableHead>
              <TableHead className="text-muted-foreground">24h Change</TableHead>
              <TableHead className="text-muted-foreground">AI Sentiment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {marketData.map((asset) => (
              <TableRow 
                key={asset.id} 
                className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onTokenSelect?.(asset)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <PallyIcon />
                    {asset.name} <span className="text-muted-foreground ml-1">{asset.symbol}</span>
                  </div>
                </TableCell>
                <TableCell>${asset.price}</TableCell>
                <TableCell className={asset.positive ? "text-green-600" : "text-red-600"}>
                  <div className="flex items-center">
                    {asset.positive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {asset.change}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`
                      ${
                        asset.sentiment === "Bullish"
                          ? "border-green-200 text-green-600"
                          : asset.sentiment === "Bearish"
                            ? "border-red-200 text-red-600"
                            : "border-border text-muted-foreground"
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
