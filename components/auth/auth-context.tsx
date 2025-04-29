"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        // TODO: Implement actual session check with your auth provider
        setLoading(false)
      } catch (error) {
        console.error("Session check failed:", error)
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // TODO: Implement actual sign in with your auth provider
      setUser({ id: "1", email, name: "User" })
      router.push("/dashboard")
    } catch (error) {
      console.error("Sign in failed:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      // TODO: Implement actual sign out with your auth provider
      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Sign out failed:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // TODO: Implement actual sign up with your auth provider
      setUser({ id: "1", email, name })
      router.push("/dashboard")
    } catch (error) {
      console.error("Sign up failed:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 