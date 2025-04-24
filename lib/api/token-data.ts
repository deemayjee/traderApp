import { PublicKey } from '@solana/web3.js'

export interface TokenMetadata {
  name: string
  symbol: string
  image: string
  decimals: number
}

export interface TokenPrice {
  price: number
  priceChange24h: number
}

// Known token mints and their metadata
const KNOWN_TOKENS: Record<string, TokenMetadata> = {
  'So11111111111111111111111111111111111111112': {
    name: 'Wrapped SOL',
    symbol: 'SOL',
    image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    decimals: 9
  },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': {
    name: 'USD Coin',
    symbol: 'USDC',
    image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
    decimals: 6
  },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': {
    name: 'Tether',
    symbol: 'USDT',
    image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg',
    decimals: 6
  }
}

// Fetch token metadata from known tokens or fallback to token registry
export async function getTokenMetadata(mintAddress: string): Promise<TokenMetadata> {
  // Check if we have the token in our known tokens list
  if (KNOWN_TOKENS[mintAddress]) {
    return KNOWN_TOKENS[mintAddress]
  }

  try {
    // Fallback to token registry API
    const response = await fetch(`https://token.jup.ag/strict/${mintAddress}`)
    if (!response.ok) {
      throw new Error('Token not found in registry')
    }
    const data = await response.json()
    return {
      name: data.name,
      symbol: data.symbol,
      image: data.logoURI || '/placeholder.svg',
      decimals: data.decimals
    }
  } catch (error) {
    console.error('Error fetching token metadata:', error)
    // Return default metadata for unknown tokens
    return {
      name: mintAddress.slice(0, 4) + '...' + mintAddress.slice(-4),
      symbol: mintAddress.slice(0, 4),
      image: '/placeholder.svg',
      decimals: 9 // Default to 9 decimals for unknown tokens
    }
  }
}

// Fetch token prices from Jupiter API with fallback to CoinGecko
export async function getTokenPrice(mintAddress: string): Promise<TokenPrice> {
  try {
    // For SOL, use CoinGecko as primary source
    if (mintAddress === 'So11111111111111111111111111111111111111112') {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true')
        
        if (response.ok) {
          const data = await response.json()
          if (data.solana && data.solana.usd) {
            return {
              price: data.solana.usd,
              priceChange24h: data.solana.usd_24h_change || 0
            }
          }
        }
      } catch (error) {
        console.error('Error fetching SOL price from CoinGecko:', error)
      }
    }

    // Try Jupiter API
    try {
      const response = await fetch(`https://price.jup.ag/v4/price?ids=${mintAddress}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data[mintAddress]) {
          const priceData = data.data[mintAddress]
          return {
            price: priceData.price,
            priceChange24h: priceData.priceChange24h || 0
          }
        }
      }
    } catch (error) {
      console.error('Error fetching price from Jupiter:', error)
      // Try alternative Jupiter endpoint
      try {
        const response = await fetch(`https://jupiter-price-api.waterfallc.com/v4/price?ids=${mintAddress}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.data && data.data[mintAddress]) {
            const priceData = data.data[mintAddress]
            return {
              price: priceData.price,
              priceChange24h: priceData.priceChange24h || 0
            }
          }
        }
      } catch (fallbackError) {
        console.error('Error fetching price from Jupiter fallback endpoint:', fallbackError)
      }
    }

    // If all attempts fail, return default values
    console.warn(`No price found for token ${mintAddress}, using default values`)
    return {
      price: 0,
      priceChange24h: 0
    }
  } catch (error) {
    console.error('Error in getTokenPrice:', error)
    return {
      price: 0,
      priceChange24h: 0
    }
  }
}

// Calculate token value and allocation
export function calculateTokenValue(amount: number, price: number, decimals: number): number {
  return (amount / Math.pow(10, decimals)) * price
}

// Calculate portfolio allocation
export function calculatePortfolioAllocation(assets: Array<{ value: number }>): Array<number> {
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0)
  return assets.map(asset => totalValue > 0 ? (asset.value / totalValue) * 100 : 0)
} 