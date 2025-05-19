import { supabase, setCurrentWalletAddress } from '@/lib/supabase'
import { CryptoAlert } from '@/lib/api/crypto-api'

export async function fetchAlerts(walletAddress: string): Promise<CryptoAlert[]> {
  await setCurrentWalletAddress(walletAddress)
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as CryptoAlert[]
}

export async function createAlert(alert: Omit<CryptoAlert, 'id'>, walletAddress: string): Promise<CryptoAlert> {
  await setCurrentWalletAddress(walletAddress)
  const { data, error } = await supabase
    .from('alerts')
    .insert([{ ...alert, wallet_address: walletAddress }])
    .select()
    .single()
  if (error) throw error
  return data as CryptoAlert
}

export async function updateAlert(alert: CryptoAlert): Promise<CryptoAlert> {
  await setCurrentWalletAddress(alert.wallet_address)
  const { data, error } = await supabase
    .from('alerts')
    .update({ ...alert })
    .eq('id', alert.id)
    .select()
    .single()
  if (error) throw error
  return data as CryptoAlert
}

export async function deleteAlert(alertId: string, walletAddress: string): Promise<void> {
  await setCurrentWalletAddress(walletAddress)
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', alertId)
  if (error) throw error
} 