import { supabase } from "@/lib/supabase"

export class BetaAccessService {
  private static instance: BetaAccessService
  private tableName = 'beta_access_codes'

  private constructor() {}

  public static getInstance(): BetaAccessService {
    if (!BetaAccessService.instance) {
      BetaAccessService.instance = new BetaAccessService()
    }
    return BetaAccessService.instance
  }

  async verifyAccessCode(code: string): Promise<boolean> {
    try {
      const response = await fetch('/api/beta-access/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        throw new Error('Failed to verify code')
      }

      const data = await response.json()
      return data.isValid
    } catch (error) {
      console.error('Error in verifyAccessCode:', error)
      return false
    }
  }

  async createAccessCode(code: string): Promise<{ success: boolean; code?: string }> {
    try {
      const response = await fetch('/api/beta-access/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to generate code')
      }

      const data = await response.json()
      return { success: !!data.code, code: data.code }
    } catch (error) {
      console.error('Error in createAccessCode:', error)
      return { success: false }
    }
  }

  async deactivateAccessCode(code: string): Promise<boolean> {
    try {
      const response = await fetch('/api/beta-access/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        throw new Error('Failed to deactivate code')
      }

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Error in deactivateAccessCode:', error)
      return false
    }
  }
} 