import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Wallet, Plus, ExternalLink } from "lucide-react"

export function ConnectedWallets() {
  const wallets = [
    {
      name: "Metamask",
      address: "0x1a2b...3c4d",
      balance: "$5,234.56",
      status: "active",
    },
    {
      name: "Phantom",
      address: "5XJf...9Yzt",
      balance: "$1,876.32",
      status: "active",
    },
    {
      name: "Binance",
      address: "API Connected",
      balance: "$12,345.67",
      status: "inactive",
    },
  ]

  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center">
          <Wallet className="h-5 w-5 mr-2 text-gray-600" />
          <CardTitle className="text-lg font-semibold">Connected Wallets</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {wallets.map((wallet, index) => (
          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <div className="flex items-center">
                <h3 className="font-medium text-sm">{wallet.name}</h3>
                <Badge
                  className={`ml-2 ${
                    wallet.status === "active" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {wallet.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">{wallet.address}</p>
              <p className="text-xs font-medium mt-1">{wallet.balance}</p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-gray-600">
              <ExternalLink size={14} />
            </Button>
          </div>
        ))}

        <Button variant="outline" size="sm" className="w-full border-gray-200">
          <Plus className="h-4 w-4 mr-1" /> Connect Wallet
        </Button>
      </CardContent>
    </Card>
  )
}
