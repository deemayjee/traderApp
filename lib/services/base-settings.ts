import { supabase } from "@/lib/supabase"

export abstract class BaseSettingsService<T> {
  protected tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  protected async get(userId: string): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error(`Error fetching ${this.tableName}:`, error)
        return null
      }

      return data
    } catch (error) {
      console.error(`Error in get ${this.tableName}:`, error)
      return null
    }
  }

  protected async update(userId: string, settings: Partial<T>): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error(`Error updating ${this.tableName}:`, error)
        return null
      }

      return data
    } catch (error) {
      console.error(`Error in update ${this.tableName}:`, error)
      return null
    }
  }

  protected async create(userId: string, settings: Partial<T>): Promise<T | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .insert([{
          user_id: userId,
          ...settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error(`Error creating ${this.tableName}:`, error)
        return null
      }

      return data
    } catch (error) {
      console.error(`Error in create ${this.tableName}:`, error)
      return null
    }
  }
} 