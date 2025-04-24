import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { CryptoSignal } from '@/lib/api/crypto-api'

interface SignalResult {
  signalId: string
  entryPrice: number
  exitPrice: number | null
  profit: number | null
  status: 'open' | 'closed' | 'cancelled'
  entryTime: number
  exitTime: number | null
  notes: string
}

interface SignalDBSchema extends DBSchema {
  signals: {
    key: string
    value: CryptoSignal & {
      created: number
      updated: number
      status: 'active' | 'completed' | 'invalidated'
    }
    indexes: { 'by-symbol': string; 'by-status': string }
  }
  results: {
    key: string
    value: SignalResult
    indexes: { 'by-signal': string }
  }
}

class SignalStorage {
  private db: IDBPDatabase<SignalDBSchema> | null = null
  private dbName = 'trading-signals-db'
  private version = 1

  async connect() {
    if (!this.db) {
      this.db = await openDB<SignalDBSchema>(this.dbName, this.version, {
        upgrade(db) {
          // Create signals store
          const signalsStore = db.createObjectStore('signals', {
            keyPath: 'id',
          })
          signalsStore.createIndex('by-symbol', 'symbol')
          signalsStore.createIndex('by-status', 'status')

          // Create results store
          const resultsStore = db.createObjectStore('results', {
            keyPath: 'signalId',
          })
          resultsStore.createIndex('by-signal', 'signalId')
        },
      })
    }
    return this.db
  }

  async saveSignal(signal: CryptoSignal) {
    const db = await this.connect()
    const now = Date.now()
    
    await db.put('signals', {
      ...signal,
      created: now,
      updated: now,
      status: 'active',
    })
  }

  async updateSignalStatus(signalId: string, status: 'active' | 'completed' | 'invalidated') {
    const db = await this.connect()
    const signal = await db.get('signals', signalId)
    
    if (signal) {
      await db.put('signals', {
        ...signal,
        status,
        updated: Date.now(),
      })
    }
  }

  async saveSignalResult(result: SignalResult) {
    const db = await this.connect()
    await db.put('results', result)

    // Update signal status if result indicates completion
    if (result.status === 'closed') {
      await this.updateSignalStatus(result.signalId, 'completed')
    }
  }

  async getSignalsBySymbol(symbol: string) {
    const db = await this.connect()
    return db.getAllFromIndex('signals', 'by-symbol', symbol)
  }

  async getActiveSignals() {
    const db = await this.connect()
    return db.getAllFromIndex('signals', 'by-status', 'active')
  }

  async getSignalResult(signalId: string) {
    const db = await this.connect()
    return db.get('results', signalId)
  }

  async getSignalHistory(symbol: string, limit = 50) {
    const db = await this.connect()
    const signals = await this.getSignalsBySymbol(symbol)
    const results = await Promise.all(
      signals.map(signal => this.getSignalResult(signal.id))
    )

    return signals
      .map((signal, index) => ({
        signal,
        result: results[index],
      }))
      .filter(item => item.result)
      .sort((a, b) => b.signal.updated - a.signal.updated)
      .slice(0, limit)
  }

  async calculatePerformanceMetrics(symbol: string) {
    const history = await this.getSignalHistory(symbol)
    const completedTrades = history.filter(
      item => item.result && item.result.status === 'closed'
    )

    if (completedTrades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        averageProfit: 0,
        totalProfit: 0,
      }
    }

    const winningTrades = completedTrades.filter(
      item => item.result && item.result.profit! > 0
    )

    return {
      totalTrades: completedTrades.length,
      winRate: (winningTrades.length / completedTrades.length) * 100,
      averageProfit:
        completedTrades.reduce((sum, item) => sum + (item.result?.profit || 0), 0) /
        completedTrades.length,
      totalProfit: completedTrades.reduce(
        (sum, item) => sum + (item.result?.profit || 0),
        0
      ),
    }
  }
}

export const signalStorage = new SignalStorage() 