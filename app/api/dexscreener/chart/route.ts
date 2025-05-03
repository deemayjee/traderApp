import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic' // This ensures the route is dynamic

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const symbol = url.searchParams.get('symbol')
    const interval = url.searchParams.get('interval') || '1h'
    const limit = parseInt(url.searchParams.get('limit') || '24', 10)

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      )
    }

    // First get the token pair from DexScreener
    const pairResponse = await fetch(
      `https://api.dexscreener.com/latest/dex/search?q=${symbol}`,
      {
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
        cache: "no-store",
      }
    )

    if (!pairResponse.ok) {
      throw new Error(`DexScreener API error: ${pairResponse.status}`)
    }

    const pairData = await pairResponse.json()
    const pair = pairData.pairs?.[0]

    if (!pair) {
      throw new Error("No pair found")
    }

    // Since DexScreener doesn't provide detailed historical data,
    // we'll generate simulated data based on current price and changes
    const now = Date.now()
    const basePrice = parseFloat(pair.priceUsd)
    const priceChange = pair.priceChange.h24 || 0
    const volatility = Math.abs(priceChange / 100) * 2

    // Calculate time step based on interval
    const getTimeStep = (interval: string) => {
      switch (interval) {
        case '1m': return 60000 // 1 minute
        case '5m': return 300000 // 5 minutes
        case '15m': return 900000 // 15 minutes
        case '1h': return 3600000 // 1 hour
        case '1d': return 86400000 // 1 day
        default: return 3600000
      }
    }

    const timeStep = getTimeStep(interval)
    const totalTime = timeStep * limit

    const prices: [number, number][] = []
    const volumes: [number, number][] = []

    let lastPrice = basePrice - (priceChange / 100 * basePrice)

    for (let i = 0; i < limit; i++) {
      const timestamp = now - (limit - i) * timeStep
      
      // Create realistic price movements
      const trendFactor = Math.sin(i / limit * Math.PI) * volatility // Add a sine wave trend
      const randomFactor = (Math.random() - 0.5) * volatility
      const priceChange = (trendFactor + randomFactor) * lastPrice * 0.01
      
      lastPrice = i === limit - 1 ? basePrice : lastPrice + priceChange
      
      // Generate volume with some correlation to price changes
      const volumeBase = pair.volume.h24 ? pair.volume.h24 / 24 : 1000000
      const volumeChange = Math.abs(priceChange / lastPrice) * 2
      const volume = volumeBase * (0.8 + volumeChange + Math.random() * 0.4)

      prices.push([timestamp, lastPrice])
      volumes.push([timestamp, volume])
    }

    return NextResponse.json({ prices, volumes })
  } catch (error) {
    console.error('Error in /api/dexscreener/chart:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    )
  }
} 