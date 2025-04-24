import { marketDataService } from './market-data-service'
import { TechnicalAnalyzer } from './technical-analyzer'
import { OnChainAnalyzer } from './onchain-analyzer'
import { MacroAnalyzer } from './macro-analyzer'
import type { AIAgent } from '@/components/ai-agents/create-agent-dialog'
import type { Signal } from './agent-storage'

export interface SignalAnalysis {
  type: 'Buy' | 'Sell'
  confidence: number
  signal: string
  price: number
  timestamp: number
}

class AIAgentService {
  private technicalAnalyzer = new TechnicalAnalyzer()
  private onChainAnalyzer = new OnChainAnalyzer()
  private macroAnalyzer = new MacroAnalyzer()

  async analyzeMarket(agent: AIAgent): Promise<Signal | null> {
    try {
      console.log(`Analyzing market for agent: ${agent.name}`)
      
      // Get market data for the agent's focus assets
      const marketData = await marketDataService.getMarketData()
      const focusAssets = marketData.filter(asset => 
        agent.focusAssets.includes(asset.id)
      )
      
      console.log(`Found ${focusAssets.length} focus assets for analysis`)
      
      if (focusAssets.length === 0) {
        console.log('No focus assets found for analysis')
        return null
      }

      // Get historical data for analysis
      const historicalData = await Promise.all(
        focusAssets.map(asset => 
          marketDataService.getMarketChart(asset.id, '7')
        )
      )

      console.log('Historical data fetched for analysis')

      // Analyze each asset
      for (let i = 0; i < focusAssets.length; i++) {
        const asset = focusAssets[i]
        const assetHistoricalData = historicalData[i]
        
        console.log(`Analyzing ${asset.name}...`)
        
        let analysis: SignalAnalysis | null = null
        
        // Route to appropriate analyzer based on agent type
        switch (agent.type) {
          case 'Technical Analysis':
            analysis = await this.technicalAnalyzer.analyze(
              [asset],
              assetHistoricalData.prices.map(([timestamp, price]) => ({ timestamp, price })),
              agent
            )
            break
          case 'On-chain Analysis':
            analysis = await this.onChainAnalyzer.analyze(asset)
            break
          case 'Macro Analysis':
            analysis = await this.macroAnalyzer.analyze(asset)
            break
        }

        if (analysis) {
          console.log(`Analysis complete for ${asset.name}:`, {
            type: analysis.type,
            confidence: analysis.confidence,
            signal: analysis.signal
          })

          // Adjust confidence based on risk tolerance
          const adjustedConfidence = this.adjustConfidenceForRisk(
            analysis.confidence,
            agent.riskTolerance
          )

          console.log(`Adjusted confidence for risk tolerance: ${adjustedConfidence}`)

          // Only generate signal if confidence is high enough
          if (adjustedConfidence >= 70) {
            const signal: Signal = {
              id: crypto.randomUUID(),
              agentId: agent.id,
              assetId: asset.id,
              type: analysis.type,
              confidence: adjustedConfidence,
              price: analysis.price,
              timestamp: Date.now(),
              message: analysis.signal,
              status: 'active'
            }

            console.log('Signal generated:', signal)
            return signal
          } else {
            console.log(`Confidence ${adjustedConfidence} below threshold of 70`)
          }
        } else {
          console.log(`No analysis generated for ${asset.name}`)
        }
      }

      console.log('No signals generated for any assets')
      return null
    } catch (error) {
      console.error('Error in market analysis:', error)
      return null
    }
  }

  private adjustConfidence(confidence: number, riskTolerance: number): number {
    // Adjust confidence based on risk tolerance
    // Higher risk tolerance = higher confidence threshold
    const riskFactor = riskTolerance / 100
    return confidence * (1 + riskFactor)
  }

  private adjustConfidenceForRisk(confidence: number, riskTolerance: number): number {
    // Adjust confidence based on risk tolerance
    // Higher risk tolerance = higher confidence threshold
    const riskFactor = riskTolerance / 100
    return confidence * (1 + riskFactor)
  }

  // Start monitoring for an agent
  startMonitoring(agent: AIAgent, onSignal: (signal: Signal) => void) {
    // Subscribe to market data updates
    agent.focusAssets.forEach(asset => {
      marketDataService.subscribe(asset.toLowerCase(), async (data) => {
        const signal = await this.analyzeMarket(agent)
        if (signal) {
          onSignal(signal)
        }
      })
    })
  }

  // Stop monitoring for an agent
  stopMonitoring(agent: AIAgent) {
    agent.focusAssets.forEach(asset => {
      marketDataService.unsubscribe(asset.toLowerCase(), () => {})
    })
  }
}

export const aiAgentService = new AIAgentService() 