import { marketDataService } from './market-data-service'
import { TechnicalAnalyzer } from './technical-analyzer'
import { OnChainAnalyzer } from './onchain-analyzer'
import { MacroAnalyzer } from './macro-analyzer'
import type { AIAgent } from '@/components/ai-agents/create-agent-dialog'
import type { Signal } from './agent-storage'
import { supabaseAdmin } from '@/lib/supabase/server-admin'
import { WebSocket } from 'ws'

export interface SignalAnalysis {
  type: 'Buy' | 'Sell'
  confidence: number
  signal: string
  price: number
  timestamp: number
}

export interface TrainingConfig {
  trainingPeriod: number
  initialCapital: number
  maxDrawdown: number
  targetMetrics: {
    winRate: number
    profitFactor: number
    sharpeRatio: number
  }
  learningRate: number
  batchSize: number
  epochs: number
}

export interface TrainingMetrics {
  currentEpoch: number
  winRate: number
  profitFactor: number
  sharpeRatio: number
  totalTrades: number
  successfulTrades: number
  totalProfit: number
  maxDrawdown: number
  learningProgress: number
}

class AIAgentService {
  private technicalAnalyzer = new TechnicalAnalyzer()
  private onchainAnalyzer = new OnChainAnalyzer()
  private macroAnalyzer = new MacroAnalyzer()
  private trainingWebSockets: Map<string, WebSocket> = new Map()

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
            analysis = await this.onchainAnalyzer.analyze(asset)
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

  async trainAgent(agent: AIAgent, config: TrainingConfig, jobId: string): Promise<void> {
    try {
      // Initialize WebSocket connection for real-time updates
      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/training/${jobId}`)
      this.trainingWebSockets.set(jobId, ws)

      // 1. Collect training data
      const historicalData = await this.collectTrainingData(agent.focusAssets, config.trainingPeriod)
      
      // 2. Extract features
      const features = this.extractFeatures(historicalData, agent.indicators)
      
      // 3. Train model
      for (let epoch = 0; epoch < config.epochs; epoch++) {
        const batch = this.getTrainingBatch(features, config.batchSize)
        await this.trainModel(batch, config.learningRate)
        
        // Calculate and send metrics
        const metrics = await this.calculateMetrics(agent, features, epoch, config.epochs)
        this.sendMetrics(jobId, metrics)
        
        // Check if training should stop
        if (this.shouldStopTraining(metrics, config)) {
          break
        }
      }
      
      // 4. Save trained model
      await this.saveModel(agent.id, jobId)
      
      // 5. Update job status
      await this.updateJobStatus(jobId, 'completed')
      
      // Close WebSocket connection
      ws.close()
      this.trainingWebSockets.delete(jobId)
    } catch (error) {
      console.error('Error in training process:', error)
      await this.updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error')
      throw error
    }
  }

  private async collectTrainingData(assets: string[], period: number): Promise<any[]> {
    const data = await Promise.all(
      assets.map(asset => marketDataService.getHistoricalData(asset, period))
    )
    return this.preprocessData(data)
  }

  private preprocessData(data: any[]): any[] {
    // Implement data preprocessing logic
    return data.map(assetData => ({
      prices: assetData.prices,
      volumes: assetData.volumes,
      indicators: this.calculateIndicators(assetData),
      sentiment: this.calculateSentiment(assetData)
    }))
  }

  private calculateIndicators(data: any): any {
    // Implement technical indicator calculations
    return {
      rsi: this.calculateRSI(data.prices),
      macd: this.calculateMACD(data.prices),
      movingAverages: this.calculateMovingAverages(data.prices)
    }
  }

  private calculateSentiment(data: any): number {
    // Implement sentiment analysis
    return 0.5 // Placeholder
  }

  private extractFeatures(data: any[], indicators: string[]): any[] {
    return data.map(assetData => ({
      technical: this.extractTechnicalFeatures(assetData, indicators),
      onchain: this.extractOnchainFeatures(assetData),
      sentiment: this.extractSentimentFeatures(assetData)
    }))
  }

  private getTrainingBatch(features: any[], batchSize: number): any[] {
    // Implement batch selection logic
    const shuffled = [...features].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, batchSize)
  }

  private async trainModel(batch: any[], learningRate: number): Promise<void> {
    // Implement model training logic
    // This is where you would use your ML framework of choice
    await new Promise(resolve => setTimeout(resolve, 100)) // Placeholder
  }

  private async calculateMetrics(
    agent: AIAgent,
    features: any[],
    currentEpoch: number,
    totalEpochs: number
  ): Promise<TrainingMetrics> {
    // Implement metrics calculation
    return {
      currentEpoch,
      winRate: Math.random() * 30 + 50, // Placeholder
      profitFactor: Math.random() + 1, // Placeholder
      sharpeRatio: Math.random() * 2, // Placeholder
      totalTrades: Math.floor(Math.random() * 100), // Placeholder
      successfulTrades: Math.floor(Math.random() * 50), // Placeholder
      totalProfit: Math.random() * 10, // Placeholder
      maxDrawdown: Math.random() * 20, // Placeholder
      learningProgress: (currentEpoch / totalEpochs) * 100
    }
  }

  private shouldStopTraining(metrics: TrainingMetrics, config: TrainingConfig): boolean {
    return (
      metrics.winRate >= config.targetMetrics.winRate &&
      metrics.profitFactor >= config.targetMetrics.profitFactor &&
      metrics.sharpeRatio >= config.targetMetrics.sharpeRatio
    )
  }

  private async saveModel(agentId: string, jobId: string): Promise<void> {
    if (!supabaseAdmin) return

    await supabaseAdmin
      .from('agent_training_jobs')
      .update({
        model_data: 'trained_model_data', // Replace with actual model data
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
  }

  private async updateJobStatus(
    jobId: string,
    status: 'training' | 'completed' | 'failed',
    error?: string
  ): Promise<void> {
    if (!supabaseAdmin) return

    await supabaseAdmin
      .from('agent_training_jobs')
      .update({
        status,
        completed_at: status !== 'training' ? new Date().toISOString() : null,
        error: error || null
      })
      .eq('id', jobId)
  }

  private sendMetrics(jobId: string, metrics: TrainingMetrics): void {
    const ws = this.trainingWebSockets.get(jobId)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'metrics',
        metrics
      }))
    }
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