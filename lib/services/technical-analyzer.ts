import { marketDataService } from './market-data-service'
import type { AIAgent } from '@/components/ai-agents/create-agent-dialog'
import type { SignalAnalysis } from './ai-agent-service'

export class TechnicalAnalyzer {
  async analyze(marketData: any[], historicalData: any[], agent: AIAgent): Promise<SignalAnalysis | null> {
    try {
      // Calculate technical indicators
      const indicators = await this.calculateIndicators(historicalData, agent.indicators)
      
      // Analyze price action
      const priceAction = this.analyzePriceAction(marketData[0])
      
      // Analyze volume
      const volumeAnalysis = this.analyzeVolume(marketData[0])
      
      // Calculate overall confidence
      const confidence = this.calculateConfidence(indicators, priceAction, volumeAnalysis)
      
      // Determine signal type
      const signalType = this.determineSignalType(indicators, priceAction, volumeAnalysis)
      
      if (!signalType) return null
      
      return {
        type: signalType,
        confidence,
        signal: this.generateSignalMessage(indicators, priceAction, volumeAnalysis),
        price: marketData[0].current_price,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Error in technical analysis:', error)
      return null
    }
  }

  private async calculateIndicators(historicalData: any[], indicators: string[]) {
    const results: Record<string, number> = {}
    
    for (const indicator of indicators) {
      switch (indicator) {
        case 'RSI':
          results.RSI = this.calculateRSI(historicalData)
          break
        case 'MACD':
          const macd = this.calculateMACD(historicalData)
          results.MACD = macd.value
          results.MACD_Signal = macd.signal
          break
        case 'SMA':
          results.SMA_20 = this.calculateSMA(historicalData, 20)
          results.SMA_50 = this.calculateSMA(historicalData, 50)
          break
        case 'EMA':
          results.EMA_20 = this.calculateEMA(historicalData, 20)
          results.EMA_50 = this.calculateEMA(historicalData, 50)
          break
      }
    }
    
    return results
  }

  private calculateRSI(data: any[]): number {
    // Calculate RSI using 14 periods
    const periods = 14
    const changes = data.slice(1).map((d, i) => d.price - data[i].price)
    const gains = changes.map(c => c > 0 ? c : 0)
    const losses = changes.map(c => c < 0 ? -c : 0)
    
    const avgGain = gains.slice(0, periods).reduce((a, b) => a + b, 0) / periods
    const avgLoss = losses.slice(0, periods).reduce((a, b) => a + b, 0) / periods
    
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  private calculateMACD(data: any[]): { value: number; signal: number } {
    // Calculate MACD using standard parameters (12, 26, 9)
    const ema12 = this.calculateEMA(data, 12)
    const ema26 = this.calculateEMA(data, 26)
    const macd = ema12 - ema26
    const signal = this.calculateEMA([{ price: macd }], 9)
    
    return { value: macd, signal }
  }

  private calculateSMA(data: any[], period: number): number {
    const prices = data.map(d => d.price)
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0)
    return sum / period
  }

  private calculateEMA(data: any[], period: number): number {
    const prices = data.map(d => d.price)
    const multiplier = 2 / (period + 1)
    let ema = prices[0]
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema
    }
    
    return ema
  }

  private analyzePriceAction(marketData: any) {
    const price = marketData.current_price
    const high24h = marketData.high_24h
    const low24h = marketData.low_24h
    
    return {
      isNearHigh: price > high24h * 0.95,
      isNearLow: price < low24h * 1.05,
      priceChange24h: marketData.price_change_percentage_24h
    }
  }

  private analyzeVolume(marketData: any) {
    const volume24h = marketData.total_volume
    const avgVolume = marketData.market_cap / marketData.current_price
    
    return {
      volumeRatio: volume24h / avgVolume,
      isHighVolume: volume24h > avgVolume * 1.5
    }
  }

  private calculateConfidence(indicators: Record<string, number>, priceAction: any, volumeAnalysis: any): number {
    let confidence = 50 // Base confidence
    
    // RSI confidence
    if (indicators.RSI) {
      if (indicators.RSI < 30 || indicators.RSI > 70) confidence += 20
    }
    
    // MACD confidence
    if (indicators.MACD && indicators.MACD_Signal) {
      if (indicators.MACD > indicators.MACD_Signal) confidence += 15
    }
    
    // Price action confidence
    if (priceAction.isNearHigh) confidence -= 10
    if (priceAction.isNearLow) confidence += 10
    
    // Volume confidence
    if (volumeAnalysis.isHighVolume) confidence += 15
    
    return Math.min(100, Math.max(0, confidence))
  }

  private determineSignalType(indicators: Record<string, number>, priceAction: any, volumeAnalysis: any): 'Buy' | 'Sell' | null {
    let buySignals = 0
    let sellSignals = 0
    
    // RSI signals
    if (indicators.RSI) {
      if (indicators.RSI < 30) buySignals++
      if (indicators.RSI > 70) sellSignals++
    }
    
    // MACD signals
    if (indicators.MACD && indicators.MACD_Signal) {
      if (indicators.MACD > indicators.MACD_Signal) buySignals++
      if (indicators.MACD < indicators.MACD_Signal) sellSignals++
    }
    
    // Price action signals
    if (priceAction.isNearLow) buySignals++
    if (priceAction.isNearHigh) sellSignals++
    
    // Volume signals
    if (volumeAnalysis.isHighVolume) {
      if (priceAction.priceChange24h > 0) buySignals++
      if (priceAction.priceChange24h < 0) sellSignals++
    }
    
    if (buySignals > sellSignals) return 'Buy'
    if (sellSignals > buySignals) return 'Sell'
    return null
  }

  private generateSignalMessage(indicators: Record<string, number>, priceAction: any, volumeAnalysis: any): string {
    const messages: string[] = []
    
    if (indicators.RSI) {
      messages.push(`RSI: ${indicators.RSI.toFixed(2)}`)
    }
    
    if (indicators.MACD) {
      messages.push(`MACD: ${indicators.MACD.toFixed(2)}`)
    }
    
    if (priceAction.priceChange24h) {
      messages.push(`24h Change: ${priceAction.priceChange24h.toFixed(2)}%`)
    }
    
    if (volumeAnalysis.volumeRatio) {
      messages.push(`Volume Ratio: ${volumeAnalysis.volumeRatio.toFixed(2)}x`)
    }
    
    return messages.join(' | ')
  }
} 