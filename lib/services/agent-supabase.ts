import { supabase, setCurrentWalletAddress, getCurrentWalletAddress } from '@/lib/supabase'
import type { AIAgent } from '@/components/ai-agents/create-agent-dialog'

export interface Signal {
  id: string
  agentId: string
  asset: string
  type: 'Buy' | 'Sell'
  signal: string
  price: number
  timestamp: number
  result?: 'Success' | 'Failure' | 'Pending'
  profit?: number
  confidence: number
}

class AgentSupabase {
  async saveAgent(agent: AIAgent, wallet_address?: string): Promise<void> {
    if (!wallet_address) throw new Error('Wallet address is required to save an agent')

    try {
      // Ensure we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      if (!session) {
        throw new Error('No active session. Please authenticate first.')
      }

      // Set the wallet address for RLS policies
      await setCurrentWalletAddress(wallet_address)

      // Verify the wallet address was set correctly
      const currentWallet = await getCurrentWalletAddress()
      if (currentWallet !== wallet_address) {
        throw new Error('Failed to set wallet address for RLS policies')
      }

      const { error } = await supabase
        .from('ai_agents')
        .upsert({
          id: agent.id || undefined,
          name: agent.name,
          type: agent.type,
          description: agent.description,
          is_active: agent.active,
          wallet_address: wallet_address,
          configuration: {
            custom: agent.custom,
            riskTolerance: agent.riskTolerance,
            focusAssets: agent.focusAssets,
            indicators: agent.indicators,
          },
          performance_metrics: {
            accuracy: agent.accuracy,
            signals: agent.signals,
            lastSignal: agent.lastSignal,
          },
        }, {
          onConflict: 'id'
        })
      if (error) throw error
    } catch (error) {
      console.error('Error in saveAgent:', error)
      throw error
    }
  }

  async getAgent(id: string): Promise<AIAgent | undefined> {
    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return undefined
    return this.mapAgent(data)
  }

  async getAllAgents(wallet_address?: string): Promise<AIAgent[]> {
    let query = supabase
      .from('ai_agents')
      .select('*')
    if (wallet_address) {
      query = query.eq('wallet_address', wallet_address)
    }
    const { data, error } = await query
    if (error) return []
    return (data || []).map(this.mapAgent)
  }

  async getActiveAgents(wallet_address?: string): Promise<AIAgent[]> {
    let query = supabase
      .from('ai_agents')
      .select('*')
      .eq('is_active', true)
    if (wallet_address) {
      query = query.eq('wallet_address', wallet_address)
    }
    const { data, error } = await query
    if (error) return []
    return (data || []).map(this.mapAgent)
  }

  async saveSignal(signal: Signal): Promise<void> {
    const { error } = await supabase
      .from('ai_signals')
      .upsert({ ...signal })
    if (error) throw error
  }

  async deleteAgent(agentId: string, wallet_address?: string): Promise<void> {
    if (!wallet_address) throw new Error('Wallet address is required to delete an agent')

    // Set the wallet address for RLS policies
    await setCurrentWalletAddress(wallet_address)

    const { error } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', agentId)
      .eq('wallet_address', wallet_address)

    if (error) {
      console.error('Error deleting agent:', error)
      throw error
    }
  }

  async getSignalsByAgent(agentId: string): Promise<Signal[]> {
    const { data, error } = await supabase
      .from('ai_signals')
      .select('*')
      .eq('agentId', agentId)
      .order('timestamp', { ascending: false })
    if (error) return []
    return data || []
  }

  async getRecentSignals(limit: number = 10): Promise<Signal[]> {
    const { data, error } = await supabase
      .from('ai_signals')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)
    if (error) return []
    return data || []
  }

  // Helper to map DB row to AIAgent
  private mapAgent(row: any): AIAgent {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      description: row.description,
      active: row.is_active,
      accuracy: row.performance_metrics?.accuracy ?? 0,
      signals: row.performance_metrics?.signals ?? 0,
      lastSignal: row.performance_metrics?.lastSignal ?? '',
      custom: row.configuration?.custom ?? false,
      riskTolerance: row.configuration?.riskTolerance ?? 50,
      focusAssets: row.configuration?.focusAssets ?? [],
      indicators: row.configuration?.indicators ?? [],
    }
  }
}

export const agentSupabase = new AgentSupabase() 