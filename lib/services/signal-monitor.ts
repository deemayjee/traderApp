import { CryptoSignal } from "@/lib/api/crypto-api"
import { toast } from "@/components/ui/use-toast"
import { useNotifications } from "@/lib/services/notification-service"

export class SignalMonitor {
  private signals: Map<string, CryptoSignal> = new Map()
  private priceHistory: Map<string, number[]> = new Map()
  private validationInterval: NodeJS.Timeout | null = null
  private onSignalUpdate: (signals: CryptoSignal[]) => void
  private addNotification: (notification: any) => void

  constructor(
    onSignalUpdate: (signals: CryptoSignal[]) => void,
    addNotification: (notification: any) => void
  ) {
    this.onSignalUpdate = onSignalUpdate
    this.addNotification = addNotification
  }

  public start() {
    // Validate signals every minute
    this.validationInterval = setInterval(() => this.validateSignals(), 60000)
  }

  public stop() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval)
      this.validationInterval = null
    }
  }

  public updateSignals(newSignals: CryptoSignal[]) {
    // Update signals map
    newSignals.forEach(signal => {
      this.signals.set(signal.id, signal)
    })

    // Update price history
    newSignals.forEach(signal => {
      if (!this.priceHistory.has(signal.symbol)) {
        this.priceHistory.set(signal.symbol, [])
      }
      const history = this.priceHistory.get(signal.symbol)!
      history.push(signal.priceValue)
      if (history.length > 100) {
        history.shift()
      }
    })

    // Notify parent component
    this.onSignalUpdate(Array.from(this.signals.values()))
  }

  public updatePrice(symbol: string, price: number) {
    if (!this.priceHistory.has(symbol)) {
      this.priceHistory.set(symbol, [])
    }
    const history = this.priceHistory.get(symbol)!
    history.push(price)
    if (history.length > 100) {
      history.shift()
    }
  }

  private async validateSignals() {
    const updatedSignals: CryptoSignal[] = []

    for (const [id, signal] of this.signals) {
      if (signal.result !== "Pending") continue

      const priceHistory = this.priceHistory.get(signal.symbol) || []
      if (priceHistory.length < 2) continue

      const currentPrice = priceHistory[priceHistory.length - 1]
      const signalPrice = signal.priceValue
      const priceChange = ((currentPrice - signalPrice) / signalPrice) * 100

      // Determine if signal was successful
      let result: "Success" | "Failure" | "Pending" = "Pending"
      let profit: string | undefined

      if (signal.type === "Buy") {
        if (priceChange >= 2) {
          result = "Success"
          profit = `+${priceChange.toFixed(2)}%`
        } else if (priceChange <= -2) {
          result = "Failure"
          profit = `${priceChange.toFixed(2)}%`
        }
      } else if (signal.type === "Sell") {
        if (priceChange <= -2) {
          result = "Success"
          profit = `+${Math.abs(priceChange).toFixed(2)}%`
        } else if (priceChange >= 2) {
          result = "Failure"
          profit = `-${priceChange.toFixed(2)}%`
        }
      }

      if (result !== "Pending") {
        const updatedSignal = {
          ...signal,
          result,
          profit,
          updated: Date.now()
        }

        this.signals.set(id, updatedSignal)
        updatedSignals.push(updatedSignal)

        // Send notification
        this.addNotification({
          title: `Signal ${result}: ${signal.symbol} ${signal.type}`,
          message: `Signal ${result.toLowerCase()} with ${profit} profit`,
          type: "signal",
          priority: result === "Success" ? "high" : "medium",
          signalId: id
        })

        // Show toast
        toast({
          title: `Signal ${result}`,
          description: `${signal.symbol} ${signal.type} signal ${result.toLowerCase()} with ${profit} profit`,
          variant: result === "Success" ? "default" : "destructive"
        })
      }
    }

    if (updatedSignals.length > 0) {
      this.onSignalUpdate(Array.from(this.signals.values()))
    }
  }
} 