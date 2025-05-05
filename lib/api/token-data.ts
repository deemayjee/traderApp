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
    // Use Solana Token List API
    const response = await fetch('https://token-list-api.solana.cloud/v1/tokens')
    if (!response.ok) {
      throw new Error('Failed to fetch token list')
    }
    const data = await response.json()
    
    // Find the token in the list
    const token = data.tokens.find((token: any) => token.address === mintAddress)
    
    if (token) {
      return {
        name: token.name,
        symbol: token.symbol,
        image: token.logoURI || '/placeholder.svg',
        decimals: token.decimals
      }
    }

    // If token not found, try Solana Token Registry
    const registryResponse = await fetch(`https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json`)
    if (!registryResponse.ok) {
      throw new Error('Failed to fetch token registry')
    }
    const registryData = await registryResponse.json()
    
    const registryToken = registryData.tokens.find((token: any) => token.address === mintAddress)
    if (registryToken) {
      return {
        name: registryToken.name,
        symbol: registryToken.symbol,
        image: registryToken.logoURI || '/placeholder.svg',
        decimals: registryToken.decimals
      }
    }

    throw new Error('Token not found in registry')
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

// Fetch token prices from CoinGecko with fallback to Jupiter API
export async function getTokenPrice(mintAddress: string): Promise<TokenPrice> {
  try {
    // For SOL, use a direct price fetch
    if (mintAddress === 'So11111111111111111111111111111111111111112') {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true')
      const data = await response.json()
      return {
        price: data.solana.usd,
        priceChange24h: data.solana.usd_24h_change
      }
    }

    // For other tokens, try to get their price from CoinGecko
    const metadata = await getTokenMetadata(mintAddress)
    if (!metadata || !metadata.symbol) {
      throw new Error('No metadata found for token')
    }

    // Search for the token on CoinGecko
    const searchResponse = await fetch(`https://api.coingecko.com/api/v3/search?query=${metadata.symbol}`)
    const searchData = await searchResponse.json()
    const token = searchData.coins.find((coin: any) => 
      coin.symbol.toLowerCase() === metadata.symbol.toLowerCase() &&
      coin.platforms.solana === mintAddress
    )

    if (token) {
      const priceResponse = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${token.id}&vs_currencies=usd&include_24hr_change=true`)
      const priceData = await priceResponse.json()
      if (priceData[token.id]?.usd > 0) {
        return {
          price: priceData[token.id].usd,
          priceChange24h: priceData[token.id].usd_24h_change
        }
      }
    }

    // Fallback: Try Jupiter Aggregator API for price
    const jupiterResponse = await fetch(`https://price.jup.ag/v4/price?ids=${mintAddress}`)
    if (jupiterResponse.ok) {
      const jupiterData = await jupiterResponse.json()
      const priceInfo = jupiterData.data?.[mintAddress]
      if (priceInfo && priceInfo.price > 0) {
        return {
          price: priceInfo.price,
          priceChange24h: 0 // Jupiter does not provide 24h change
        }
      }
    }

    // If all fails, return 0
    throw new Error('No price found from CoinGecko or Jupiter')
  } catch (error) {
    console.error('Error fetching price from CoinGecko or Jupiter:', error)
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