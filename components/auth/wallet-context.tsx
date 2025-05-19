"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, lazy, Suspense } from "react"
import { usePrivy } from '@privy-io/react-auth'
import { supabase } from '@/lib/supabase'
import { SessionStorage } from '@/lib/services/session-storage'
import { Loading } from '@/components/ui/loading'

// Lazy load components
const WalletConnectModal = lazy(() => import('@/components/wallet/wallet-connect-modal'))
const WalletErrorModal = lazy(() => import('@/components/wallet/wallet-error-modal'))

type WalletData = {
  address: string
  chain: string
}

export interface User {
  address: string
  wallet?: WalletData
  id?: string
  name?: string
  avatar?: string
}

type WalletContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  getWalletAddress: () => string | null
}

const WalletContext = createContext<WalletContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  getWalletAddress: () => null,
})

export const useWalletAuth = () => useContext(WalletContext)

export function WalletAuthProvider({ children }: { children: React.ReactNode }) {
  const { login: privyLogin, logout: privyLogout, authenticated, user: privyUser } = usePrivy()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionStorage = SessionStorage.getInstance()

  // Parallel API calls function
  const syncUserWithBackend = useCallback(async (walletAddress: string, userId: string) => {
    try {
      const [userResponse, supabaseResponse] = await Promise.all([
        fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet: { address: walletAddress, chain: 'solana' }
          })
        }),
        supabase.rpc('set_current_wallet_address', {
          wallet_address: walletAddress
        })
      ])

      if (!userResponse.ok) {
        const errorText = await userResponse.text()
        throw new Error(`API error: ${userResponse.status} ${errorText}`)
      }

      const { error: supabaseError } = supabaseResponse
      if (supabaseError) {
        throw new Error(`Supabase error: ${supabaseError.message}`)
      }

      return true
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to sync user data')
      return false
    }
  }, [])

  useEffect(() => {
    const syncUser = async () => {
      setIsLoading(true)

      try {
        // First check session storage
        const cachedUser = sessionStorage.getSession()
        if (cachedUser) {
          setUser(cachedUser)
          setIsLoading(false)
          return
        }

        // Then check Privy
        if (authenticated && privyUser?.wallet?.address) {
          const walletAddress = privyUser.wallet.address
          const userData: User = {
            address: walletAddress,
            wallet: {
              address: walletAddress,
              chain: 'solana',
            },
            id: privyUser.id,
          }

          // Sync with backend in parallel
          await syncUserWithBackend(walletAddress, privyUser.id)
          
          setUser(userData)
          sessionStorage.setSession(userData)
        } else {
          setUser(null)
        }
      } catch (error) {
        setUser(null)
        setError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    syncUser()
  }, [authenticated, privyUser, syncUserWithBackend])

  const login = async () => {
    try {
      setShowConnectModal(true)
      await privyLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      throw err
    }
  }

  const logout = async () => {
    try {
      await privyLogout()
      setUser(null)
      sessionStorage.clearSession()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed')
      throw err
    }
  }

  const getWalletAddress = () => user?.address || null

  if (isLoading) {
    return <Loading variant="fullscreen" />
  }

  return (
    <WalletContext.Provider
      value={{
        user,
        isAuthenticated: authenticated,
        isLoading,
        login,
        logout,
        getWalletAddress,
      }}
    >
      {children}
      
      <Suspense fallback={<Loading variant="fullscreen" />}>
        {showConnectModal && (
          <WalletConnectModal
            onClose={() => setShowConnectModal(false)}
            onError={(error) => setError(error)}
          />
        )}
        
        {error && (
          <WalletErrorModal
            error={error}
            onClose={() => setError(null)}
          />
        )}
      </Suspense>
    </WalletContext.Provider>
  )
} 