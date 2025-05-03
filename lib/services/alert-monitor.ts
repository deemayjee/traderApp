// Define the alert type that matches TradingAlerts' expectations
interface TradingAlert {
  id: string
  type: "price" | "volume" | "trend"
  symbol: string
  condition: string
  value: number
  active: boolean
  priority: "high" | "medium" | "low"
  timestamp: string
}

import { toast } from "@/components/ui/use-toast"

interface AlertMonitorOptions {
  onAlertTriggered: (alert: TradingAlert) => void
}

export class AlertMonitor {
  private ws: WebSocket | null = null
  private alerts: TradingAlert[] = []
  private onAlertTriggered: (alert: TradingAlert) => void
  private symbols: Set<string> = new Set()
  private triggeredAlerts: Set<string> = new Set()

  constructor({ onAlertTriggered }: AlertMonitorOptions) {
    this.onAlertTriggered = onAlertTriggered
  }

  public start(alerts: TradingAlert[]) {
    this.alerts = alerts
    this.symbols = new Set(alerts.map(alert => `${alert.symbol.toLowerCase()}usdt`))
    
    if (this.ws) {
      this.ws.close()
    }

    // Connect to Binance WebSocket
    this.ws = new WebSocket('wss://stream.binance.com:9443/ws')
    
    this.ws.onopen = () => {
      // Subscribe to ticker streams for all alert symbols
      const subscribeMessage = {
        method: "SUBSCRIBE",
        params: Array.from(this.symbols).map(symbol => `${symbol}@ticker`),
        id: 1
      }
      this.ws?.send(JSON.stringify(subscribeMessage))
    }

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.e === '24hrTicker') {
        this.checkAlerts(data)
      }
    }

    this.ws.onerror = (error) => {
      toast({
        title: "Alert Monitor Error",
        description: "Failed to connect to price feed. Alerts may not trigger.",
        variant: "destructive",
      })
    }

    this.ws.onclose = () => {
      setTimeout(() => this.start(this.alerts), 5000)
    }
  }

  public stop() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.triggeredAlerts.clear()
  }

  public updateAlerts(alerts: TradingAlert[]) {
    this.alerts = alerts
    const newSymbols = new Set(alerts.map(alert => `${alert.symbol.toLowerCase()}usdt`))
    
    if (this.symbols.size !== newSymbols.size || 
        Array.from(this.symbols).some(s => !newSymbols.has(s))) {
      this.symbols = newSymbols
      this.start(alerts)
    }
  }

  private checkAlerts(tickerData: any) {
    const symbol = tickerData.s.toLowerCase().replace('usdt', '')
    const currentPrice = parseFloat(tickerData.c)
    
    this.alerts.forEach(alert => {
      if (alert.symbol.toLowerCase() === symbol && alert.active) {
        const shouldTrigger = this.checkAlertCondition(alert, currentPrice)
        if (shouldTrigger && !this.triggeredAlerts.has(alert.id)) {
          this.triggeredAlerts.add(alert.id)
          this.onAlertTriggered(alert)
        }
      }
    })
  }

  private checkAlertCondition(alert: TradingAlert, currentPrice: number): boolean {
    switch (alert.type) {
      case 'price':
        if (alert.condition === 'above') {
          return currentPrice >= alert.value
        } else {
          return currentPrice <= alert.value
        }
      case 'volume':
        return false
      case 'trend':
        return false
      default:
        return false
    }
  }
} 