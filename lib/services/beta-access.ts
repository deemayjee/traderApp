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

  async createAccessCode(code: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .insert([{
          code,
          is_active: true
        }])

      if (error) {
        console.error('Error creating access code:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in createAccessCode:', error)
      return false
    }
  }

  async deactivateAccessCode(code: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .update({ is_active: false })
        .eq('code', code)

      if (error) {
        console.error('Error deactivating access code:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deactivateAccessCode:', error)
      return false
    }
  }
} 