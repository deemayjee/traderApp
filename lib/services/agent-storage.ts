import { openDB, DBSchema } from 'idb'

interface AgentDB extends DBSchema {
  agents: {
    key: string
    value: AIAgent
    indexes: { 'by-active': boolean }
  }
  signals: {
    key: string
    value: Signal
    indexes: { 'by-agentId': string, 'by-timestamp': number }
  }
}

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

export interface AIAgent {
  id: string
  name: string
  type: 'Technical Analysis' | 'On-chain Analysis' | 'Macro Analysis'
  description: string
  active: boolean
  accuracy: number
  signals: number
  lastSignal: string
  custom: boolean
  riskTolerance: number
  focusAssets: string[]
  indicators: string[]
}

class AgentStorage {
  private db: Promise<IDBDatabase>

  constructor() {
    this.db = openDB<AgentDB>('agent-db', 1, {
      upgrade(db) {
        // Create agents store
        const agentsStore = db.createObjectStore('agents', { keyPath: 'id' })
        agentsStore.createIndex('by-active', 'active')

        // Create signals store
        const signalsStore = db.createObjectStore('signals', { keyPath: 'id' })
        signalsStore.createIndex('by-agentId', 'agentId')
        signalsStore.createIndex('by-timestamp', 'timestamp')
      },
    })
  }

  async saveAgent(agent: AIAgent): Promise<void> {
    const db = await this.db
    await db.put('agents', agent)
  }

  async getAgent(id: string): Promise<AIAgent | undefined> {
    const db = await this.db
    return db.get('agents', id)
  }

  async getAllAgents(): Promise<AIAgent[]> {
    const db = await this.db
    return db.getAll('agents')
  }

  async getActiveAgents(): Promise<AIAgent[]> {
    const db = await this.db
    return db.getAllFromIndex('agents', 'by-active', IDBKeyRange.only(true))
  }

  async saveSignal(signal: Signal): Promise<void> {
    const db = await this.db
    await db.put('signals', signal)
  }

  async getSignalsByAgent(agentId: string): Promise<Signal[]> {
    const db = await this.db
    return db.getAllFromIndex('signals', 'by-agentId', IDBKeyRange.only(agentId))
  }

  async getRecentSignals(limit: number = 10): Promise<Signal[]> {
    const db = await this.db
    const index = db.transaction('signals').store.index('by-timestamp')
    const cursor = await index.openCursor(null, 'prev')
    const signals: Signal[] = []
    
    let count = 0
    while (cursor && count < limit) {
      signals.push(cursor.value)
      await cursor.continue()
      count++
    }
    
    return signals
  }
}

export const agentStorage = new AgentStorage() 