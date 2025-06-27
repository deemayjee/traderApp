import type { AIAgent } from '@/components/ai-agents/create-agent-dialog'

export interface Signal {
  id: string
  agentId: string
  asset: string
  type: 'Buy' | 'Sell'
  signal: string
  price: number
  timestamp: number
  result: 'Success' | 'Failure' | 'Pending'
  profit?: number
  confidence: number
  time?: string
}

class AgentSupabase {
  async saveAgent(agent: AIAgent, wallet_address?: string): Promise<void> {
    if (!wallet_address) throw new Error('Wallet address is required to save an agent')

    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agent, wallet_address }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save agent')
      }
    } catch (error) {
      console.error('Error in saveAgent:', error)
      throw error
    }
  }

  async getAgent(id: string): Promise<AIAgent | undefined> {
    try {
      const response = await fetch(`/api/agents?id=${id}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch agent')
      }
      const data = await response.json()
      return data.agents?.[0] ? this.mapAgent(data.agents[0]) : undefined
    } catch (error) {
      console.error('Error in getAgent:', error)
      return undefined
    }
  }

  async getAllAgents(wallet_address?: string): Promise<AIAgent[]> {
    try {
      const url = wallet_address 
        ? `/api/agents?wallet_address=${wallet_address}`
        : '/api/agents'
      const response = await fetch(url)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch agents')
      }
      const data = await response.json()
      return (data.agents || []).map(this.mapAgent)
    } catch (error) {
      console.error('Error in getAllAgents:', error)
      return []
    }
  }

  async getActiveAgents(wallet_address?: string): Promise<AIAgent[]> {
    try {
      const url = wallet_address 
        ? `/api/agents?wallet_address=${wallet_address}&active=true`
        : '/api/agents?active=true'
      const response = await fetch(url)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch active agents')
      }
      const data = await response.json()
      return (data.agents || []).map(this.mapAgent)
    } catch (error) {
      console.error('Error in getActiveAgents:', error)
      return []
    }
  }

  async saveSignal(signal: Signal): Promise<void> {
    try {
      const response = await fetch('/api/signals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signal),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save signal')
      }
    } catch (error) {
      console.error('Error in saveSignal:', error)
      throw error
    }
  }

  async deleteAgent(agentId: string, wallet_address?: string): Promise<void> {
    if (!wallet_address) throw new Error('Wallet address is required to delete an agent')

    try {
      const response = await fetch(`/api/agents?id=${agentId}&wallet_address=${wallet_address}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete agent')
      }
    } catch (error) {
      console.error('Error in deleteAgent:', error)
      throw error
    }
  }

  async getSignalsByAgent(agentId: string): Promise<Signal[]> {
    try {
      const response = await fetch(`/api/signals?agentId=${agentId}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch signals')
      }
      const data = await response.json()
      return data.signals || []
    } catch (error) {
      console.error('Error in getSignalsByAgent:', error)
      return []
    }
  }

  async getRecentSignals(limit: number = 10): Promise<Signal[]> {
    try {
      const response = await fetch(`/api/signals?limit=${limit}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch recent signals')
      }
      const data = await response.json()
      return data.signals || []
    } catch (error) {
      console.error('Error in getRecentSignals:', error)
      return []
    }
  }

  // Helper to map DB row to AIAgent
  private mapAgent(row: any): AIAgent {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      active: row.is_active,
      isActive: row.is_active, // Also map to isActive for automation system
      accuracy: row.performance_metrics?.accuracy ?? 0,
      signals: row.performance_metrics?.signals ?? 0,
      lastSignal: row.performance_metrics?.lastSignal ?? '',
      custom: row.configuration?.custom ?? false,
      riskTolerance: row.configuration?.riskTolerance ?? 50,
      focusAssets: row.configuration?.focusAssets ?? [],
      indicators: row.configuration?.indicators ?? [],
      // Map additional required fields for trading automation
      maxPositionSize: row.configuration?.maxPositionSize ?? 1000,
      leverage: row.configuration?.leverage ?? 1,
      tradingPairs: row.configuration?.tradingPairs ?? ['BTC-USD', 'ETH-USD'],
      walletAddress: row.wallet_address,
      tradingEnabled: row.configuration?.tradingEnabled ?? true,
    }
  }
}

export const agentSupabase = new AgentSupabase() 