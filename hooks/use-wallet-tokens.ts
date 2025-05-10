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

  useEffect(() => {
    let mounted = true
    const fetchTokenHoldings = async () => {
      if (!isAuthenticated || !user?.address) {
        if (mounted) setIsLoading(false)
        return
      }
      try {
        if (mounted) {
          setIsLoading(true)
          setError(null)
        }
        const walletAddress = new PublicKey(user.address)
        const [solBalance, tokenAccounts] = await Promise.all([
          connection.getBalance(walletAddress),
          connection.getParsedTokenAccountsByOwner(walletAddress, {
            programId: TOKEN_PROGRAM_ID,
          })
        ])
        if (!mounted) return
        const solBalanceInSOL = solBalance / 1e9
        const solPrice = await getTokenPrice('So11111111111111111111111111111111111111112')
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
        const batchSize = 5
        const enrichedHoldings: (ProcessedTokenAccount | null)[] = []
        for (let i = 0; i < tokenHoldings.length; i += batchSize) {
          if (!mounted) return
          const batch = tokenHoldings.slice(i, i + batchSize)
          const mintAddresses = batch.map(account => account.account.data.parsed.info.mint)
          const [metadataBatch, priceBatch] = await Promise.all([
            Promise.all(mintAddresses.map(mint => getTokenMetadata(mint))),
            Promise.all(mintAddresses.map(mint => getTokenPrice(mint)))
          ])
          const batchResults = await Promise.all(
            batch.map((account, index) => {
              try {
                const info = account.account.data.parsed.info
                const mintAddress = info.mint
                const metadata = metadataBatch[index]
                const price = priceBatch[index]
                const tokenAmount = Number(info.tokenAmount.amount)
                const value = calculateTokenValue(tokenAmount, price.price, metadata.decimals)
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
                return null
              }
            })
          )
          enrichedHoldings.push(...batchResults)
          if (i + batchSize < tokenHoldings.length) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
        if (!mounted) return
        const validHoldings = enrichedHoldings.filter(
          (holding): holding is ProcessedTokenAccount => holding !== null && holding.value > 0
        )
        const totalValue = validHoldings.reduce((sum, asset) => sum + asset.value, 0) + solValue
        const allAssets = [solTokenAccount, ...validHoldings].map(asset => ({
          ...asset,
          allocation: totalValue > 0 ? (asset.value / totalValue) * 100 : 0
        }))
        if (mounted) {
          setAssets(allAssets)
          setError(null)
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to fetch token holdings")
          setIsLoading(false)
        }
      }
    }
    fetchTokenHoldings()
    return () => { mounted = false }
  }, [isAuthenticated, user?.address, connection])

  return { assets, isLoading, error }
} 