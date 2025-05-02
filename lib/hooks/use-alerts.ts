import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Alert {
  id: string
  type: 'price' | 'market' | 'news' | 'social'
  title: string
  message: string
  created_at: string
  read: boolean
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAlerts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ read: true })
        .eq('id', alertId)

      if (error) throw error
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark alert as read')
    }
  }

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId)

      if (error) throw error
      setAlerts(alerts.filter(alert => alert.id !== alertId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert')
    }
  }

  return {
    alerts,
    loading,
    error,
    markAsRead,
    deleteAlert,
    refresh: fetchAlerts
  }
} 