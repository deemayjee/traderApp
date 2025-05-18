import { useState, useEffect, useMemo } from "react"
import { useWalletAuth } from "@/components/auth/wallet-context"
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { getTokenMetadata, getTokenPrice, calculateTokenValue, TokenMetadata, TokenPrice } from "@/lib/api/token-data"

export interface TokenAccount {
  mint: string
  amount: number
  decimals: number
  metadata?: TokenMetadata
  price?: TokenPrice
  value?: number
  formattedAmount?: string
  formattedValue?: string
  change?: string
  changePercent?: number
  positive?: boolean
  allocation?: number
}

export interface ProcessedTokenAccount extends TokenAccount {
  metadata: TokenMetadata
  price: TokenPrice
  value: number
  formattedAmount: string
  formattedValue: string
  change: string
  changePercent: number
  positive: boolean
  allocation: number
}

export function useWalletTokens() {
  const { user, isAuthenticated } = useWalletAuth()
  const connection = useMemo(() => new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("mainnet-beta"),
    { commitment: 'confirmed' }
  ), [])

  const [assets, setAssets] = useState<ProcessedTokenAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(true)

  const fetchTokenHoldings = async () => {
    try {
      if (!isAuthenticated || !user?.address) {
        console.log("Not authenticated or no user address")
        if (mounted) setIsLoading(false)
        return
      }
      console.log("Starting token fetch for address:", user.address)
      if (mounted) {
        setIsLoading(true)
        setError(null)
      }
      const walletAddress = new PublicKey(user.address)
      console.log("Fetching SOL balance and token accounts...")
      const [solBalance, tokenAccounts] = await Promise.all([
        connection.getBalance(walletAddress),
        connection.getParsedTokenAccountsByOwner(walletAddress, {
          programId: TOKEN_PROGRAM_ID,
        })
      ])
      if (!mounted) return
      console.log("SOL balance:", solBalance)
      console.log("Token accounts found:", tokenAccounts.value.length)
      
      const solBalanceInSOL = solBalance / 1e9
      console.log("Fetching SOL price...")
      const solPrice = await getTokenPrice('So11111111111111111111111111111111111111112')
      console.log("SOL price:", solPrice)
      const solValue = solBalanceInSOL * solPrice.price
      const solTokenAccount: ProcessedTokenAccount = {
        mint: 'So11111111111111111111111111111111111111112',
        amount: solBalance,
        decimals: 9,
        metadata: {
          name: 'Solana',
          symbol: 'SOL',
          image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
          decimals: 9
        },
        price: solPrice,
        value: solValue,
        formattedAmount: `${solBalanceInSOL.toFixed(4)} SOL`,
        formattedValue: `$${solValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: `${solPrice.priceChange24h > 0 ? '+' : ''}${solPrice.priceChange24h.toFixed(2)}%`,
        changePercent: solPrice.priceChange24h,
        positive: solPrice.priceChange24h > 0,
        allocation: 0
      }
      const tokenHoldings = tokenAccounts.value.filter(account => account.account.data.parsed.info.tokenAmount.uiAmount > 0)
      console.log("Token holdings with non-zero balance:", tokenHoldings.length)
      
      const batchSize = 5
      const enrichedHoldings: (ProcessedTokenAccount | null)[] = []
      for (let i = 0; i < tokenHoldings.length; i += batchSize) {
        if (!mounted) return
        const batch = tokenHoldings.slice(i, i + batchSize)
        const mintAddresses = batch.map(account => account.account.data.parsed.info.mint)
        console.log("Processing batch of tokens:", mintAddresses)
        
        try {
          const [metadataBatch, priceBatch] = await Promise.all([
            Promise.all(mintAddresses.map(mint => getTokenMetadata(mint))),
            Promise.all(mintAddresses.map(mint => getTokenPrice(mint)))
          ])
          console.log("Metadata batch:", metadataBatch)
          console.log("Price batch:", priceBatch)
          
          const batchResults = await Promise.all(
            batch.map((account, index) => {
              try {
                const info = account.account.data.parsed.info
                const mintAddress = info.mint
                const metadata = metadataBatch[index]
                const price = priceBatch[index]
                const tokenAmount = Number(info.tokenAmount.amount)
                const value = calculateTokenValue(tokenAmount, price.price, metadata.decimals)
                console.log("Processed token:", {
                  mint: mintAddress,
                  name: metadata.name,
                  amount: tokenAmount,
                  value: value,
                  decimals: metadata.decimals,
                  uiAmount: info.tokenAmount.uiAmount,
                  rawAmount: info.tokenAmount.amount
                })
                return {
                  mint: mintAddress,
                  amount: tokenAmount,
                  decimals: metadata.decimals,
                  metadata,
                  price,
                  value,
                  formattedAmount: `${info.tokenAmount.uiAmount} ${metadata.symbol}`,
                  formattedValue: `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  change: `${price.priceChange24h > 0 ? '+' : ''}${price.priceChange24h.toFixed(2)}%`,
                  changePercent: price.priceChange24h,
                  positive: price.priceChange24h > 0,
                  allocation: 0
                }
              } catch (error) {
                console.error("Error processing token in batch:", error)
                return null
              }
            })
          )
          enrichedHoldings.push(...batchResults)
        } catch (error) {
          console.error("Error processing batch:", error)
        }
        
        if (i + batchSize < tokenHoldings.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      if (!mounted) return
      const validHoldings = enrichedHoldings.filter(
        (holding): holding is ProcessedTokenAccount => holding !== null
      )
      console.log("Valid holdings after processing:", validHoldings.length)
      
      const totalValue = validHoldings.reduce((sum, asset) => sum + asset.value, 0) + solValue
      const allAssets = [solTokenAccount, ...validHoldings].map(asset => ({
        ...asset,
        allocation: totalValue > 0 ? (asset.value / totalValue) * 100 : 0
      }))
      console.log("Final assets array:", allAssets)
      
      if (mounted) {
        setAssets(allAssets)
        setError(null)
        setIsLoading(false)
      }
    } catch (err) {
      console.error("Error in fetchTokenHoldings:", err)
      if (mounted) {
        setError(err instanceof Error ? err.message : "Failed to fetch token holdings")
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchTokenHoldings()
    return () => { setMounted(false) }
  }, [isAuthenticated, user?.address, connection])

  return { assets, isLoading, error, refetch: fetchTokenHoldings }
} 