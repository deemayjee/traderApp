"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Settings, ArrowUpRight, StopCircle } from "lucide-react"

interface Wallet {
  address: string
  name: string
}

interface ActiveCopiesProps {
  wallets: Wallet[]
}

export function ActiveCopies({ wallets }: ActiveCopiesProps) {
  return (
    <Card className="border-gray-200">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Active Copy Trades</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {wallets.length > 0 ? (
          <>
            {wallets.map((wallet) => (
              <div key={wallet.address} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={"/placeholder.svg"} alt={wallet.name} />
                      <AvatarFallback>{wallet.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{wallet.name}</p>
                      <p className="text-xs text-gray-500">{wallet.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Button variant="destructive" size="sm">
                      Stop Copying
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">You are not copying any traders yet.</p>
            <Button className="mt-4 bg-black text-white hover:bg-gray-800">Start Copy Trading</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
