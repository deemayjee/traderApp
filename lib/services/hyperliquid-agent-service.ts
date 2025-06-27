import { AIAgent } from "@/components/ai-agents/create-agent-dialog"
import { hyperliquidWalletService } from "./hyperliquid-wallet-service"
import { aiAgentService } from "./ai-agent-service"

export interface HyperliquidTradeSignal {
  agentId: string
  symbol: string
  action: 'buy' | 'sell' | 'close'
  confidence: number
  size: number
  price?: number
  leverage: number
  reason: string
  timestamp: number
}

export interface AgentPosition {
  agentId: string
  symbol: string
  size: number
  entryPrice: number
  currentPrice: number
  unrealizedPnl: number
  leverage: number
  side: 'long' | 'short'
  timestamp: number
}

export interface AgentPerformance {
  agentId: string
  totalTrades: number
  winningTrades: number
  losingTrades: number
  totalPnl: number
  winRate: number
  avgTradeSize: number
  sharpeRatio: number
  maxDrawdown: number
  dailyPnl: number
  lastTradeTime: number
}

class HyperliquidAgentService {
  private activeAgents = new Map<string, AIAgent>()
  private agentPositions = new Map<string, AgentPosition[]>()
  private agentPerformance = new Map<string, AgentPerformance>()
  private marketAnalysisInterval: NodeJS.Timeout | null = null

  /**
   * Deploy an AI agent to start trading on Hyperliquid
   */
  async deployAgent(agent: AIAgent): Promise<void> {
    try {
      console.log(`Deploying agent ${agent.name} to Hyperliquid...`)
      
      // Validate agent configuration
      if (!agent.walletAddress) {
        throw new Error("Agent must have a connected wallet address")
      }

      if (!agent.tradingEnabled) {
        console.log(`Agent ${agent.name} deployed in monitoring mode (trading disabled)`)
        this.activeAgents.set(agent.id, agent)
        return
      }

      // Validate wallet balance
      const balance = await hyperliquidWalletService.getWalletBalance(agent.walletAddress)
      const balanceNum = parseFloat(balance)
      
      if (balanceNum < agent.maxPositionSize / 1000) {
        throw new Error(`Insufficient balance. Required: ${agent.maxPositionSize / 1000} HYPE, Available: ${balanceNum} HYPE`)
      }

      // Initialize agent performance tracking
      this.initializeAgentPerformance(agent.id)
      
      // Add to active agents
      this.activeAgents.set(agent.id, agent)
      
      // Start monitoring if this is the first agent
      if (this.activeAgents.size === 1) {
        this.startMarketMonitoring()
      }

      console.log(`Agent ${agent.name} successfully deployed and monitoring ${agent.tradingPairs.length} trading pairs`)
    } catch (error) {
      console.error(`Failed to deploy agent ${agent.name}:`, error)
      throw error
    }
  }

  /**
   * Stop and remove an agent from trading
   */
  async stopAgent(agentId: string): Promise<void> {
    try {
      const agent = this.activeAgents.get(agentId)
      if (!agent) {
        throw new Error("Agent not found")
      }

      // Close all open positions for this agent
      await this.closeAllPositions(agentId)
      
      // Remove from active agents
      this.activeAgents.delete(agentId)
      
      // Stop monitoring if no agents left
      if (this.activeAgents.size === 0) {
        this.stopMarketMonitoring()
      }

      console.log(`Agent ${agent.name} stopped and all positions closed`)
    } catch (error) {
      console.error(`Failed to stop agent ${agentId}:`, error)
      throw error
    }
  }

  /**
   * Execute a trade signal from an AI agent
   */
  async executeTradeSignal(signal: HyperliquidTradeSignal): Promise<boolean> {
    try {
      const agent = this.activeAgents.get(signal.agentId)
      if (!agent) {
        console.error(`Agent ${signal.agentId} not found`)
        return false
      }

      if (!agent.tradingEnabled) {
        console.log(`Agent ${agent.name} has trading disabled, skipping signal`)
        return false
      }

      // Validate signal against agent's risk parameters
      if (!this.validateSignal(signal, agent)) {
        console.log(`Signal validation failed for agent ${agent.name}`)
        return false
      }

      // Check daily loss limit
      const performance = this.agentPerformance.get(signal.agentId)
      if (performance && performance.dailyPnl <= -agent.maxDailyLoss) {
        console.log(`Agent ${agent.name} has reached daily loss limit`)
        return false
      }

      // Execute the trade
      const success = await this.executeTrade(signal, agent)
      
      if (success) {
        // Update agent performance
        this.updateAgentPerformance(signal.agentId, signal)
        console.log(`Trade executed successfully for agent ${agent.name}: ${signal.action} ${signal.size} ${signal.symbol}`)
      }

      return success
    } catch (error) {
      console.error(`Failed to execute trade signal:`, error)
      return false
    }
  }

  /**
   * Get real-time performance for an agent
   */
  getAgentPerformance(agentId: string): AgentPerformance | null {
    return this.agentPerformance.get(agentId) || null
  }

  /**
   * Get current positions for an agent
   */
  getAgentPositions(agentId: string): AgentPosition[] {
    return this.agentPositions.get(agentId) || []
  }

  /**
   * Get all active agents
   */
  getActiveAgents(): AIAgent[] {
    return Array.from(this.activeAgents.values())
  }

  private initializeAgentPerformance(agentId: string): void {
    this.agentPerformance.set(agentId, {
      agentId,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalPnl: 0,
      winRate: 0,
      avgTradeSize: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      dailyPnl: 0,
      lastTradeTime: Date.now()
    })
    this.agentPositions.set(agentId, [])
  }

  private validateSignal(signal: HyperliquidTradeSignal, agent: AIAgent): boolean {
    // Check if trading pair is allowed
    if (!agent.tradingPairs.includes(signal.symbol)) {
      console.log(`Trading pair ${signal.symbol} not allowed for agent ${agent.name}`)
      return false
    }

    // Check position size limits
    if (signal.size > agent.maxPositionSize) {
      console.log(`Position size ${signal.size} exceeds limit ${agent.maxPositionSize}`)
      return false
    }

    // Check leverage limits
    if (signal.leverage > agent.leverage) {
      console.log(`Leverage ${signal.leverage} exceeds limit ${agent.leverage}`)
      return false
    }

    // Check confidence threshold based on risk tolerance
    const minConfidence = 70 + (agent.riskTolerance * 0.3) // 70-100% based on risk tolerance
    if (signal.confidence < minConfidence) {
      console.log(`Signal confidence ${signal.confidence} below threshold ${minConfidence}`)
      return false
    }

    return true
  }

  private async executeTrade(signal: HyperliquidTradeSignal, agent: AIAgent): Promise<boolean> {
    try {
      // Mock trade execution - replace with actual Hyperliquid API calls
      console.log(`Executing trade for ${agent.name}:`, {
        symbol: signal.symbol,
        action: signal.action,
        size: signal.size,
        leverage: signal.leverage,
        confidence: signal.confidence
      })

      // Simulate trade execution delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update positions
      this.updateAgentPosition(signal, agent)

      return true
    } catch (error) {
      console.error(`Trade execution failed:`, error)
      return false
    }
  }

  private updateAgentPosition(signal: HyperliquidTradeSignal, agent: AIAgent): void {
    const positions = this.agentPositions.get(signal.agentId) || []
    
    // Mock position update
    const newPosition: AgentPosition = {
      agentId: signal.agentId,
      symbol: signal.symbol,
      size: signal.size,
      entryPrice: signal.price || 0,
      currentPrice: signal.price || 0,
      unrealizedPnl: 0,
      leverage: signal.leverage,
      side: signal.action === 'buy' ? 'long' : 'short',
      timestamp: signal.timestamp
    }

    positions.push(newPosition)
    this.agentPositions.set(signal.agentId, positions)
  }

  private updateAgentPerformance(agentId: string, signal: HyperliquidTradeSignal): void {
    const performance = this.agentPerformance.get(agentId)
    if (!performance) return

    performance.totalTrades += 1
    performance.avgTradeSize = (performance.avgTradeSize * (performance.totalTrades - 1) + signal.size) / performance.totalTrades
    performance.lastTradeTime = signal.timestamp

    this.agentPerformance.set(agentId, performance)
  }

  private async closeAllPositions(agentId: string): Promise<void> {
    const positions = this.agentPositions.get(agentId) || []
    
    for (const position of positions) {
      // Mock position closing
      console.log(`Closing position: ${position.symbol} ${position.side} ${position.size}`)
    }

    // Clear positions
    this.agentPositions.set(agentId, [])
  }

  private startMarketMonitoring(): void {
    console.log("Starting market monitoring for AI agents...")
    
    this.marketAnalysisInterval = setInterval(async () => {
      for (const [agentId, agent] of this.activeAgents) {
        if (!agent.active) continue

        try {
          // Run market analysis for each agent
          const signal = await aiAgentService.analyzeMarket(agent)
          
          if (signal) {
                         // Convert to Hyperliquid trade signal
             const tradeSignal: HyperliquidTradeSignal = {
               agentId: agent.id,
               symbol: `${signal.asset}-USD`,
               action: signal.type.toLowerCase() as 'buy' | 'sell',
               confidence: signal.confidence,
               size: this.calculatePositionSize(agent, signal.confidence),
               leverage: agent.leverage,
               reason: signal.signal,
               timestamp: signal.timestamp
             }

            // Execute if auto-trading is enabled
            if (agent.autoTrade) {
              await this.executeTradeSignal(tradeSignal)
            } else {
              console.log(`Signal generated for ${agent.name} but auto-trading disabled:`, tradeSignal)
            }
          }
        } catch (error) {
          console.error(`Error analyzing market for agent ${agent.name}:`, error)
        }
      }
    }, 30000) // Analyze every 30 seconds
  }

  private stopMarketMonitoring(): void {
    if (this.marketAnalysisInterval) {
      clearInterval(this.marketAnalysisInterval)
      this.marketAnalysisInterval = null
      console.log("Market monitoring stopped")
    }
  }

  private calculatePositionSize(agent: AIAgent, confidence: number): number {
    // Calculate position size based on confidence and risk tolerance
    const baseSize = agent.maxPositionSize * 0.1 // Start with 10% of max
    const confidenceMultiplier = confidence / 100
    const riskMultiplier = agent.riskTolerance / 100
    
    return Math.min(
      baseSize * confidenceMultiplier * riskMultiplier,
      agent.maxPositionSize
    )
  }
}

export const hyperliquidAgentService = new HyperliquidAgentService() 