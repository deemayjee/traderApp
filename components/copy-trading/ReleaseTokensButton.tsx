import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Unlock } from "lucide-react"
import { formatAmount } from "@/lib/utils"

interface ReleaseTokensButtonProps {
  userWallet: string
  copyTradeId: string
  tokenSymbol: string
  amount: number
  decimals: number
  endDate: string
  onRelease?: () => void
}

export function ReleaseTokensButton({
  userWallet,
  copyTradeId,
  tokenSymbol,
  amount,
  decimals,
  endDate,
  onRelease
}: ReleaseTokensButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleRelease = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/copy-trading/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userWallet,
          copyTradeId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to release tokens')
      }

      toast({
        title: "Success!",
        description: `${formatAmount(amount, decimals)} ${tokenSymbol} tokens have been released back to your AI wallet.`,
      })

      // Call the onRelease callback if provided
      if (onRelease) {
        onRelease()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to release tokens",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate remaining time
  const currentTime = Date.now()
  const endTime = new Date(endDate).getTime()
  const remainingTime = Math.max(0, endTime - currentTime)
  const remainingDays = Math.ceil(remainingTime / (24 * 60 * 60 * 1000))
  const isLocked = remainingTime > 0

  return (
    <div className="flex flex-col gap-2">
      {isLocked ? (
        <div className="text-sm text-muted-foreground">
          Tokens will be unlocked in {remainingDays} days
        </div>
      ) : (
        <Button
          onClick={handleRelease}
          disabled={isLoading}
          className="w-full"
          variant="outline"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Releasing...
            </>
          ) : (
            <>
              <Unlock className="mr-2 h-4 w-4" />
              Release {formatAmount(amount, decimals)} {tokenSymbol}
            </>
          )}
        </Button>
      )}
    </div>
  )
} 