"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '@/lib/supabase'

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
  const { login: privyLogin, logout: privyLogout, authenticated, user: privyUser } = usePrivy();
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const syncUser = async () => {
      console.log('syncUser effect triggered:', { authenticated, privyUser });
      setIsLoading(true)

      // Check for existing session in localStorage
      const storedSession = localStorage.getItem('pallycryp-auth-token');
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          if (sessionData?.user?.id) {
            setUser({
              address: sessionData.user.id,
              wallet: {
                address: sessionData.user.id,
                chain: 'solana',
              },
              id: sessionData.user.id,
            });
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error parsing stored session:', error);
        }
      }

      if (authenticated && privyUser) {
        try {
          // Get the Solana wallet address directly from privyUser.wallet
          const solanaWallet = privyUser.wallet;
          const walletAddress = solanaWallet?.address;
          
          if (walletAddress) {
            console.log('Wallet connected:', {
              address: walletAddress,
            });

            const userData: User = {
              address: walletAddress,
              wallet: {
                address: walletAddress,
                chain: 'solana',
              },
              id: privyUser.id,
              // name, avatar, etc. can be left undefined if not available
            };

            setUser(userData);

            try {
              console.log('Attempting to save wallet data to API:', userData.wallet);
              // Save the wallet info to your backend
              const response = await fetch("/api/users", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  wallet: userData.wallet,
                }),
              });

              console.log('API response status:', response.status);
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error(`API error: ${response.status}`, errorText);
              } else {
                const data = await response.json();
                console.log("User successfully synced with Supabase:", data);

                // Set the wallet address in the session
                try {
                  const { error: setWalletError } = await supabase.rpc('set_current_wallet_address', {
                    wallet_address: walletAddress
                  });
                  if (setWalletError) {
                    console.error("Error setting wallet address:", setWalletError);
                  }
                } catch (error) {
                  console.error("Error setting wallet address:", error);
                }
              }
            } catch (error) {
              console.error("Error syncing user with Supabase:", error);
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error processing wallet data:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    };

    syncUser();
  }, [authenticated, privyUser]);

  const login = async () => {
    try {
      await privyLogin();
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await privyLogout();
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
      throw err;
    }
  };

  const getWalletAddress = () => user?.address || null;

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
    </WalletContext.Provider>
  );
} 