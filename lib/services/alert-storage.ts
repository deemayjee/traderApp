import { CryptoAlert } from "@/lib/api/crypto-api"

export const alertStorage = {
  async saveAlert(alert: CryptoAlert): Promise<void> {
    try {
      const alerts = await this.getAlerts()
      alerts.push(alert)
      localStorage.setItem('alerts', JSON.stringify(alerts))
    } catch (error) {
      console.error('Error saving alert:', error)
      throw error
    }
  },
  
  async getAlerts(): Promise<CryptoAlert[]> {
    try {
      const alertsJson = localStorage.getItem('alerts')
      return alertsJson ? JSON.parse(alertsJson) : []
    } catch (error) {
      console.error('Error getting alerts:', error)
      return []
    }
  },
  
  async deleteAlert(id: string): Promise<void> {
    try {
      const alerts = await this.getAlerts()
      const filteredAlerts = alerts.filter(alert => alert.id !== id)
      localStorage.setItem('alerts', JSON.stringify(filteredAlerts))
    } catch (error) {
      console.error('Error deleting alert:', error)
      throw error
    }
  }
} 