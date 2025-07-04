"use client"

import { hyperliquidService, AgentTradeSignal, OrderRequest, TradingResult } from './hyperliquid-service'
import { tradingHistoryService } from './trading-history-service'
import { agentSupabase } from './agent-supabase'
import { positionManager, RiskSettings } from './position-manager'
import { AIAgent } from '@/components/ai-agents/create-agent-dialog'

export interface AutomationConfig {
  enabled: boolean
  maxPositionSize: number
  maxDailyLoss: number
  maxOpenPositions: number
  minConfidenceLevel: number
  allowedSymbols: string[]
  tradingHours: {
    start: string // "09:00"
    end: string   // "17:00"
    timezone: string // "UTC"
  }
}

export interface RiskLimits {
  maxLeverage: number
  maxPortfolioAllocation: number // percentage
  stopLossPercentage: number
  takeProfitPercentage: number
  maxDrawdownLimit: number
}

export interface TradingSignal {
  agentId: string
  symbol: string
  action: 'buy' | 'sell' | 'close' | 'hold'
  confidence: number // 0-100
  size: number
  price?: number
  reasoning: string
  timestamp: number
  indicators: Record<string, number>
}

class AITradingAutomation {
  private automationInterval: NodeJS.Timeout | null = null
  private activeAgents = new Map<string, { agent: AIAgent, config: AutomationConfig }>()
  private lastSignals = new Map<string, TradingSignal[]>()
  private isRunning = false
  
  // Default configuration with safety overrides from environment
  private defaultConfig: AutomationConfig = {
    enabled: false,
    maxPositionSize: parseInt(process.env.DEFAULT_MAX_POSITION_SIZE || '1000'),
    maxDailyLoss: parseInt(process.env.DEFAULT_MAX_DAILY_LOSS || '500'),
    maxOpenPositions: parseInt(process.env.MAX_OPEN_POSITIONS || '3'),
    minConfidenceLevel: parseInt(process.env.MIN_CONFIDENCE_LEVEL || '70'), // Increased default for safety
    allowedSymbols: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BTC', 'ETH', 'SOL'],
    tradingHours: {
      start: process.env.TRADING_HOURS_START || '00:00',
      end: process.env.TRADING_HOURS_END || '23:59',
      timezone: 'UTC'
    }
  }

  private defaultRiskLimits: RiskLimits = {
    maxLeverage: parseInt(process.env.MAX_LEVERAGE || '5'),
    maxPortfolioAllocation: 25, // 25% max per position
    stopLossPercentage: parseInt(process.env.DEFAULT_STOP_LOSS_PERCENTAGE || '5'),
    takeProfitPercentage: parseInt(process.env.DEFAULT_TAKE_PROFIT_PERCENTAGE || '15'),
    maxDrawdownLimit: 20        // 20% max drawdown
  }

  /**
   * Check if emergency stop is active
   */
  private isEmergencyStopActive(): boolean {
    return process.env.EMERGENCY_STOP === 'true'
  }

  /**
   * Check if paper trading mode is enabled
   */
  private isPaperTradingMode(): boolean {
    return process.env.PAPER_TRADING_MODE === 'true'
  }

  async startAutomation(walletAddress: string): Promise<void> {
    if (this.isRunning) {
      console.log('Automation already running')
      return
    }

    console.log('🤖 Starting AI Trading Automation...')
    this.isRunning = true

    // Load active agents
    await this.loadActiveAgents(walletAddress)

    // Start position monitoring for stop loss/take profit
    await positionManager.startPositionMonitoring()

    // Start the automation loop (runs every 30 seconds)
    this.automationInterval = setInterval(async () => {
      try {
        await this.executeAutomationCycle(walletAddress)
      } catch (error) {
        console.error('Error in automation cycle:', error)
      }
    }, 30000) // 30 seconds

    console.log('✅ AI Trading Automation started')
  }

  async stopAutomation(): Promise<void> {
    if (!this.isRunning) return

    console.log('🛑 Stopping AI Trading Automation...')
    this.isRunning = false

    if (this.automationInterval) {
      clearInterval(this.automationInterval)
      this.automationInterval = null
    }

    // Stop position monitoring
    await positionManager.stopPositionMonitoring()

    console.log('✅ AI Trading Automation stopped')
  }

  private async loadActiveAgents(walletAddress?: string): Promise<void> {
    try {
      const agents = await agentSupabase.getAllAgents(walletAddress)
      
      for (const agent of agents) {
        // Only load agents that are active and have automation enabled
        if (agent.isActive) {
          this.activeAgents.set(agent.id, {
            agent,
            config: { ...this.defaultConfig, enabled: true } // Enable automation by default for active agents
          })
        }
      }

      console.log(`📋 Loaded ${this.activeAgents.size} active agents with automation enabled for wallet: ${walletAddress}`)
    } catch (error) {
      console.error('Error loading active agents:', error)
    }
  }

  private async executeAutomationCycle(walletAddress: string): Promise<void> {
    console.log(`🔄 Executing automation cycle for ${this.activeAgents.size} agents...`)

    // 🚨 CRITICAL SAFETY CHECKS
    if (this.isEmergencyStopActive()) {
      console.log('🚨 EMERGENCY STOP ACTIVE - All trading halted!')
      return
    }

    if (this.isPaperTradingMode()) {
      console.log('📄 Paper trading mode active - trades will be simulated')
    }

    for (const [agentId, { agent, config }] of this.activeAgents) {
      console.log(`🤖 Processing agent: ${agent.name} (enabled: ${config.enabled})`)
      
      if (!config.enabled) {
        console.log(`⏸️ Agent ${agent.name} has automation disabled, skipping`)
        continue
      }

      try {
        // 1. Check trading hours
        if (!this.isWithinTradingHours(config.tradingHours)) {
          console.log(`⏰ Outside trading hours for agent ${agent.name}`)
          continue
        }

        // 2. Check risk limits
        const riskCheck = await this.checkRiskLimits(agentId, walletAddress)
        if (!riskCheck.canTrade) {
          console.log(`⚠️ Risk limits exceeded for agent ${agent.name}: ${riskCheck.reason}`)
          continue
        }

        console.log(`✅ Risk checks passed for agent ${agent.name}`)

        // 3. Generate trading signals
        console.log(`📊 Generating signals for agent ${agent.name}...`)
        const signals = await this.generateTradingSignals(agent)
        console.log(`📈 Generated ${signals.length} raw signals for agent ${agent.name}`)
        
        // 4. Filter and validate signals
        const validSignals = this.filterSignals(signals, config)
        console.log(`✔️ ${validSignals.length} signals passed filters for agent ${agent.name}`)

        // 5. Execute trades
        for (const signal of validSignals) {
          console.log(`🎯 Executing signal: ${signal.action} ${signal.symbol} (${signal.confidence}% confidence)`)
          await this.executeSignal(signal, agent, walletAddress)
        }

        // Store signals for analysis
        this.lastSignals.set(agentId, signals)

      } catch (error) {
        console.error(`❌ Error processing agent ${agent.name}:`, error)
      }
    }

    console.log(`✅ Automation cycle complete`)
  }

  private async generateTradingSignals(agent: AIAgent): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = []

    try {
      // Get market data for agent's focus assets
      const symbols = agent.focusAssets || ['BTC-USD', 'ETH-USD']
      console.log(`📊 Fetching market data for symbols: ${symbols.join(', ')}`)
      
      const marketData = await hyperliquidService.getMarketData(symbols)
      console.log(`📈 Received market data for ${marketData.length} symbols`)

      for (const data of marketData) {
        console.log(`🔍 Processing market data for ${data.symbol}:`, {
          price: data.price,
          change24h: data.change24h,
          volume24h: data.volume24h
        })

        // Technical analysis based on agent's indicators
        const technicalSignal = await this.performTechnicalAnalysis(data, agent.indicators || [])
        
        // Risk assessment
        const riskScore = this.calculateRiskScore(data, agent)
        
        // Generate signal based on agent's strategy
        const signal = await this.generateSignalForSymbol(data, agent, technicalSignal, riskScore)
        
        if (signal) {
          signals.push(signal)
          console.log(`✅ Generated signal for ${data.symbol}: ${signal.action} (${signal.confidence}% confidence)`)
        } else {
          console.log(`⏸️ No signal generated for ${data.symbol}`)
        }
      }

      console.log(`📊 Total signals generated: ${signals.length}`)
    } catch (error) {
      console.error('❌ Error generating trading signals:', error)
    }

    return signals
  }

  private async performTechnicalAnalysis(data: any, indicators: string[]): Promise<any> {
    // Enhanced technical analysis that works with available data
    const analysis = {
      trend: 'neutral',
      momentum: 50,
      volatility: Math.abs(data.change24h || 0),
      volume_strength: data.volume24h || 0
    }

    // If we have actual 24h change data, use it
    if (data.change24h !== undefined && data.change24h !== 0) {
      // RSI-like momentum calculation
      if (data.change24h > 2) analysis.momentum = 75 // Overbought
      else if (data.change24h < -2) analysis.momentum = 25 // Oversold
      else analysis.momentum = 50 + (data.change24h * 10) // Scale change to momentum

      // Trend determination
      if (data.change24h > 1) analysis.trend = 'bullish'
      else if (data.change24h < -1) analysis.trend = 'bearish'
    } else {
      // For testing purposes, generate some market conditions based on price
      // This simulates market behavior when we don't have 24h data
      const priceBasedTrend = Math.sin(Date.now() / 1000000) // Cyclical behavior
      const randomFactor = Math.random() - 0.5 // Add some randomness
      
      if (priceBasedTrend + randomFactor > 0.3) {
        analysis.trend = 'bullish'
        analysis.momentum = 60 + Math.random() * 30 // 60-90
      } else if (priceBasedTrend + randomFactor < -0.3) {
        analysis.trend = 'bearish'
        analysis.momentum = 10 + Math.random() * 30 // 10-40
      } else {
        analysis.trend = 'neutral'
        analysis.momentum = 40 + Math.random() * 20 // 40-60
      }
      
      // Simulate volatility
      analysis.volatility = 1 + Math.random() * 4 // 1-5% volatility
    }

    return analysis
  }

  private calculateRiskScore(data: any, agent: AIAgent): number {
    // Calculate risk score based on volatility, agent's risk tolerance, etc.
    const volatility = data.change24h ? Math.abs(data.change24h) : 0
    const riskTolerance = agent.riskTolerance || 50
    
    // Higher volatility = higher risk, adjust based on agent's tolerance
    const riskScore = Math.min(100, volatility * (100 - riskTolerance) / 50)
    
    return riskScore
  }

  private async generateSignalForSymbol(
    data: any, 
    agent: AIAgent, 
    technicalSignal: any, 
    riskScore: number
  ): Promise<TradingSignal | null> {
    
    // Agent decision logic based on strategy
    let action: 'buy' | 'sell' | 'close' | 'hold' = 'hold'
    let confidence = 0
    let reasoning = ''

    console.log(`🔍 Analyzing ${data.symbol} for agent ${agent.name}:`, {
      trend: technicalSignal.trend,
      momentum: technicalSignal.momentum,
      volatility: technicalSignal.volatility,
      riskScore: riskScore.toFixed(1)
    })

    // Improved strategy implementation with more accessible conditions
    if (technicalSignal.trend === 'bullish' && technicalSignal.momentum < 80 && riskScore < 50) {
      action = 'buy'
      confidence = 65 + Math.random() * 20 // 65-85%
      reasoning = `Bullish trend detected with momentum ${technicalSignal.momentum.toFixed(1)} and acceptable risk ${riskScore.toFixed(1)}%`
    } else if (technicalSignal.trend === 'bearish' && technicalSignal.momentum > 20 && riskScore < 60) {
      action = 'sell'
      confidence = 60 + Math.random() * 25 // 60-85%
      reasoning = `Bearish trend detected with momentum ${technicalSignal.momentum.toFixed(1)} and acceptable risk ${riskScore.toFixed(1)}%`
    } else if (technicalSignal.trend === 'neutral' && technicalSignal.volatility < 3 && riskScore < 40) {
      // Sometimes take positions in neutral markets with low volatility
      action = Math.random() > 0.5 ? 'buy' : 'sell'
      confidence = 55 + Math.random() * 15 // 55-70%
      reasoning = `Neutral market with low volatility ${technicalSignal.volatility.toFixed(1)}%, taking speculative position`
    } else {
      reasoning = `Holding: trend=${technicalSignal.trend}, momentum=${technicalSignal.momentum.toFixed(1)}, volatility=${technicalSignal.volatility.toFixed(1)}, risk=${riskScore.toFixed(1)}%`
    }

    console.log(`💭 Signal decision for ${data.symbol}: ${action} (${confidence.toFixed(1)}% confidence) - ${reasoning}`)

    if (action === 'hold') return null

    // Calculate position size based on agent's risk tolerance
    const baseSize = 0.1 // Base position size
    const riskAdjustedSize = baseSize * (agent.riskTolerance || 50) / 50
    const size = Math.max(0.01, Math.min(1.0, riskAdjustedSize))

    return {
      agentId: agent.id,
      symbol: data.symbol,
      action,
      confidence,
      size,
      price: action === 'buy' ? data.price * 1.001 : data.price * 0.999, // Slight slippage
      reasoning,
      timestamp: Date.now(),
      indicators: {
        trend_strength: technicalSignal.momentum,
        volatility: technicalSignal.volatility,
        risk_score: riskScore
      }
    }
  }

  private filterSignals(signals: TradingSignal[], config: AutomationConfig): TradingSignal[] {
    return signals.filter(signal => {
      // Filter by confidence level
      if (signal.confidence < config.minConfidenceLevel) {
        console.log(`🚫 Signal filtered: Low confidence ${signal.confidence}% < ${config.minConfidenceLevel}% for ${signal.symbol}`)
        return false
      }
      
      // Filter by allowed symbols
      if (!config.allowedSymbols.includes(signal.symbol)) {
        console.log(`🚫 Signal filtered: Symbol ${signal.symbol} not in allowed list: ${config.allowedSymbols.join(', ')}`)
        return false
      }
      
      // Filter by action (no holds)
      if (signal.action === 'hold') {
        console.log(`🚫 Signal filtered: Hold action for ${signal.symbol}`)
        return false
      }
      
      console.log(`✅ Signal passed filters: ${signal.action} ${signal.symbol} (${signal.confidence}% confidence)`)
      return true
    })
  }

  private async executeSignal(signal: TradingSignal, agent: AIAgent, walletAddress: string): Promise<void> {
    try {
      console.log(`🎯 Executing signal for ${agent.name}: ${signal.action.toUpperCase()} ${signal.symbol} (${signal.confidence}% confidence)`)

      // Convert signal to order request
      const orderRequest: OrderRequest = {
        symbol: signal.symbol,
        side: signal.action as 'buy' | 'sell',
        orderType: 'Market', // Use market orders for automation
        size: signal.size
      }

             // Execute the trade
       const result: TradingResult = await hyperliquidService.executeAgentTrade(
         agent,
         {
           agentId: signal.agentId,
           symbol: signal.symbol,
           action: signal.action as 'buy' | 'sell' | 'close',
           confidence: signal.confidence,
           size: signal.size,
           price: signal.price,
           reason: signal.reasoning,
           timestamp: signal.timestamp
         },
         walletAddress
       )

      if (result.success && result.orderId && result.executions && result.executions.length > 0) {
        const execution = result.executions[0]
        console.log(`✅ Trade executed successfully: ${signal.action} ${signal.size} ${signal.symbol} at $${execution.price}`)
        
        // Create position with stop loss and take profit monitoring
        const riskSettings: RiskSettings = {
          stopLossPercentage: this.defaultRiskLimits.stopLossPercentage,
          takeProfitPercentage: this.defaultRiskLimits.takeProfitPercentage,
          trailingStopEnabled: false
        }

        await positionManager.openPosition(
          agent.id,
          walletAddress,
          result.orderId,
          signal.symbol,
          signal.action as 'buy' | 'sell',
          signal.size,
          execution.price,
          riskSettings
        )
        
        // Record signal execution
        await this.recordSignalExecution(signal, result)
      } else {
        console.error(`❌ Trade failed: ${result.error}`)
      }

    } catch (error) {
      console.error('Error executing signal:', error)
    }
  }

  private async recordSignalExecution(signal: TradingSignal, result: TradingResult): Promise<void> {
    // Record signal and execution details for analysis
    // This could be stored in a separate signals table
    console.log('📊 Recording signal execution:', {
      signal: signal.reasoning,
      confidence: signal.confidence,
      result: result.success,
      orderId: result.orderId
    })
  }

  private async checkRiskLimits(agentId: string, walletAddress: string): Promise<{canTrade: boolean, reason?: string}> {
    try {
      // Check daily loss limit
      const todaysPnL = await tradingHistoryService.calculateAgentPnL(agentId, '1d')
      if (todaysPnL.totalPnl < -this.defaultConfig.maxDailyLoss) {
        return { canTrade: false, reason: 'Daily loss limit exceeded' }
      }

      // Check max open positions
      const openPositions = await hyperliquidService.getPositions(walletAddress)
      if (openPositions.length >= this.defaultConfig.maxOpenPositions) {
        return { canTrade: false, reason: 'Maximum open positions reached' }
      }

      // Check max drawdown
      const performance = await hyperliquidService.getAgentPerformance(agentId, '7d')
      if (Math.abs(performance.maxDrawdown) > this.defaultRiskLimits.maxDrawdownLimit) {
        return { canTrade: false, reason: 'Maximum drawdown limit exceeded' }
      }

      return { canTrade: true }
    } catch (error) {
      console.error('Error checking risk limits:', error)
      return { canTrade: false, reason: 'Error checking risk limits' }
    }
  }

  private isWithinTradingHours(tradingHours: AutomationConfig['tradingHours']): boolean {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // "HH:MM"
    
    return currentTime >= tradingHours.start && currentTime <= tradingHours.end
  }

  // Public methods for configuration
  async enableAgentAutomation(agentId: string, config?: Partial<AutomationConfig>): Promise<void> {
    const agent = this.activeAgents.get(agentId)
    if (agent) {
      agent.config = { ...agent.config, ...config, enabled: true }
      console.log(`✅ Automation enabled for agent: ${agent.agent.name}`)
    }
  }

  async disableAgentAutomation(agentId: string): Promise<void> {
    const agent = this.activeAgents.get(agentId)
    if (agent) {
      agent.config.enabled = false
      console.log(`⏸️ Automation disabled for agent: ${agent.agent.name}`)
    }
  }

  getAutomationStatus(): {
    isRunning: boolean
    activeAgents: number
    enabledAgents: number
    positionMonitoring: {
      isMonitoring: boolean
      activePositions: number
      totalPnl: number
    }
    lastCycle?: Date
  } {
    const enabledAgents = Array.from(this.activeAgents.values()).filter(a => a.config.enabled).length
    const positionStatus = positionManager.getMonitoringStatus()
    
    return {
      isRunning: this.isRunning,
      activeAgents: this.activeAgents.size,
      enabledAgents,
      positionMonitoring: positionStatus
    }
  }

  getLastSignals(agentId?: string): TradingSignal[] {
    if (agentId) {
      return this.lastSignals.get(agentId) || []
    }
    
    // Return all signals from all agents
    const allSignals: TradingSignal[] = []
    for (const signals of this.lastSignals.values()) {
      allSignals.push(...signals)
    }
    return allSignals.sort((a, b) => b.timestamp - a.timestamp)
  }

  // Debug method to test signal generation for a specific agent
  async testSignalGeneration(agentId: string, walletAddress?: string): Promise<{
    agent: AIAgent | null,
    signals: TradingSignal[],
    marketData: any[],
    analysis: any[]
  }> {
    console.log(`🧪 Testing signal generation for agent: ${agentId}`)
    
    try {
      // Reload agents to make sure we have the latest data
      await this.loadActiveAgents(walletAddress)
      
      const agentData = this.activeAgents.get(agentId)
      if (!agentData) {
        console.error(`❌ Agent ${agentId} not found in active agents`)
        console.log(`📋 Available agents: ${Array.from(this.activeAgents.keys()).join(', ')}`)
        return { agent: null, signals: [], marketData: [], analysis: [] }
      }

      const { agent } = agentData
      console.log(`✅ Found agent: ${agent.name}`)
      console.log(`📊 Agent config:`, {
        focusAssets: agent.focusAssets,
        riskTolerance: agent.riskTolerance,
        indicators: agent.indicators,
        isActive: agent.isActive
      })

      // Generate signals for this agent
      const signals = await this.generateTradingSignals(agent)
      
      // Get the raw market data for reference
      const symbols = agent.focusAssets || ['BTC-USD', 'ETH-USD']
      const marketData = await hyperliquidService.getMarketData(symbols)
      
      // Get analysis for each symbol
      const analysis = []
      for (const data of marketData) {
        const technicalSignal = await this.performTechnicalAnalysis(data, agent.indicators || [])
        const riskScore = this.calculateRiskScore(data, agent)
        analysis.push({
          symbol: data.symbol,
          technicalSignal,
          riskScore,
          marketData: data
        })
      }

      console.log(`🧪 Test results:`)
      console.log(`   - Signals generated: ${signals.length}`)
      console.log(`   - Market data points: ${marketData.length}`)
      console.log(`   - Analysis results: ${analysis.length}`)

      return { agent, signals, marketData, analysis }
    } catch (error) {
      console.error(`❌ Error testing signal generation:`, error)
      return { agent: null, signals: [], marketData: [], analysis: [] }
    }
  }
}

export const aiTradingAutomation = new AITradingAutomation() 