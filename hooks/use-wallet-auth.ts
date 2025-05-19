import { useState, useEffect } from 'react'

interface Wallet {
  address: string
  connected: boolean
}

interface User {
  wallet: Wallet | null
}

export function useWalletAuth() {
  const [user, setUser] = useState<User>({ wallet: null })
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    let mounted = true

    // Check if wallet is connected
    const checkWalletConnection = async () => {
      try {
        // Check if Phantom wallet is installed
        const { solana } = window as any
        if (!solana?.isPhantom) {
          console.log('Phantom wallet not found')
          return
        }

        // Only check connection status without trying to connect
        const isConnected = await solana.isConnected
        if (isConnected && mounted) {
          const publicKey = solana.publicKey
          if (publicKey) {
            setUser({
              wallet: {
                address: publicKey.toString(),
                connected: true
              }
            })
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
        if (mounted) {
          setUser({ wallet: null })
        }
      }
    }

    checkWalletConnection()

    // Listen for wallet connection changes
    const { solana } = window as any
    if (solana) {
      const handleConnect = () => {
        if (mounted) {
          const publicKey = solana.publicKey
          if (publicKey) {
            setUser({
              wallet: {
                address: publicKey.toString(),
                connected: true
              }
            })
          }
        }
      }

      const handleDisconnect = () => {
        if (mounted) {
          setUser({ wallet: null })
        }
      }

      solana.on('connect', handleConnect)
      solana.on('disconnect', handleDisconnect)

      return () => {
        mounted = false
        solana.removeListener('connect', handleConnect)
        solana.removeListener('disconnect', handleDisconnect)
      }
    }

    return () => {
      mounted = false
    }
  }, [])

  const connectWallet = async () => {
    if (isConnecting) {
      return false
    }

    setIsConnecting(true)
    try {
      const { solana } = window as any
      if (!solana?.isPhantom) {
        throw new Error('Phantom wallet not found')
      }

      // Check if already connected
      const isConnected = await solana.isConnected
      if (isConnected) {
        const publicKey = solana.publicKey
        if (publicKey) {
          setUser({
            wallet: {
              address: publicKey.toString(),
              connected: true
            }
          })
          return true
        }
      }

      // If not connected, try to connect
      try {
        const response = await solana.connect()
        setUser({
          wallet: {
            address: response.publicKey.toString(),
            connected: true
          }
        })
        return true
      } catch (error: any) {
        // If rate limited, wait and try again
        if (error?.message?.includes('rate limited')) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          const response = await solana.connect()
          setUser({
            wallet: {
              address: response.publicKey.toString(),
              connected: true
            }
          })
          return true
        }
        throw error
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error)
      setUser({ wallet: null })
      return false
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    try {
      const { solana } = window as any
      if (solana) {
        await solana.disconnect()
        setUser({ wallet: null })
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
    }
  }

  return { user, connectWallet, disconnectWallet, isConnecting }
} 