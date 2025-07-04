import { User } from '@/components/auth/wallet-context'

interface SessionData {
  user: User
  timestamp: number
  expiresAt: number
}

export class SessionStorage {
  private static instance: SessionStorage
  private readonly SESSION_KEY = 'pallytraders-session'
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  private constructor() {}

  static getInstance(): SessionStorage {
    if (!SessionStorage.instance) {
      SessionStorage.instance = new SessionStorage()
    }
    return SessionStorage.instance
  }

  private getStorage(): Storage | null {
    if (typeof window === 'undefined') return null
    return window.localStorage
  }

  setSession(user: User): void {
    const storage = this.getStorage()
    if (!storage) return

    const sessionData: SessionData = {
      user,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    }

    try {
      storage.setItem(this.SESSION_KEY, JSON.stringify(sessionData))
    } catch {
      // Silently fail in production
    }
  }

  getSession(): User | null {
    const storage = this.getStorage()
    if (!storage) return null

    try {
      const data = storage.getItem(this.SESSION_KEY)
      if (!data) return null

      const sessionData: SessionData = JSON.parse(data)
      
      // Check if session is expired
      if (Date.now() > sessionData.expiresAt) {
        this.clearSession()
        return null
      }

      return sessionData.user
    } catch {
      return null
    }
  }

  clearSession(): void {
    const storage = this.getStorage()
    if (!storage) return

    try {
      storage.removeItem(this.SESSION_KEY)
    } catch {
      // Silently fail in production
    }
  }

  isSessionValid(): boolean {
    return this.getSession() !== null
  }
} 