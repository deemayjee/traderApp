"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { supabase } from "@/lib/supabase"

interface UserProfile {
  username?: string
  avatar_url?: string
  wallet_address: string
}

interface UserProfileContextType {
  profile: UserProfile | null
  isLoading: boolean
  refreshProfile: () => Promise<void>
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined)

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useWalletAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async () => {
    if (!user?.address) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    try {
      // For now, just create a basic profile from wallet address
      // since we removed the user_profiles table
      setProfile({
        wallet_address: user.address,
        username: undefined,
        avatar_url: undefined
      })
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [user?.address])

  return (
    <UserProfileContext.Provider value={{ profile, isLoading, refreshProfile: fetchProfile }}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile() {
  const context = useContext(UserProfileContext)
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider')
  }
  return context
} 