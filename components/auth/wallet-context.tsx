"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';

type WalletData = {
  address: string
  chain: string
}

export interface User {
  address: string
  wallet?: WalletData
  // Add these fields to make the User type compatible with our needs
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
  const { publicKey, connected, select, disconnect, wallets } = useWallet();
  const { connection } = useConnection();

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const syncUser = async () => {
      console.log('syncUser effect triggered:', { connected, publicKey: publicKey?.toString() });
      setIsLoading(true)

      if (connected && publicKey) {
        try {
          const walletAddress = publicKey.toString();
          
          console.log('Wallet connected:', {
            address: walletAddress,
          });

          const userData: User = {
            address: walletAddress,
            wallet: {
              address: walletAddress,
              chain: 'solana',
            },
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
            }
          } catch (error) {
            console.error("Error syncing user with Supabase:", error);
          }
        } catch (error) {
          console.error("Error processing wallet data:", error);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    };

    syncUser();
  }, [connected, publicKey, connection]);

  const login = async () => {
    try {
      // Find available wallets
      if (wallets.length > 0) {
        // Default to Phantom if available, otherwise use the first wallet
        const phantomWallet = wallets.find(wallet => 
          wallet.adapter.name.toLowerCase().includes('phantom')
        );
        
        const walletToUse = phantomWallet || wallets[0];
        
        console.log(`Selecting wallet: ${walletToUse.adapter.name}`);
        select(walletToUse.adapter.name);
      } else {
        throw new Error("No wallets available");
      }
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await disconnect();
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
        isAuthenticated: connected,
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