import { NextResponse } from 'next/server'

interface TokenAccount {
  mint: string
  amount: number
  decimals: number
}

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Get token accounts for the wallet using Privy's API
    const response = await fetch(`https://auth.privy.io/api/v1/wallets/${address}/tokens`, {
      headers: {
        'Authorization': `Bearer ${process.env.PRIVY_API_SECRET}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch token accounts')
    }

    const data = await response.json()
    
    // Format the response
    const formattedAccounts: TokenAccount[] = data.tokens.map((token: any) => ({
      mint: token.mint,
      amount: token.amount,
      decimals: token.decimals
    }))

    return NextResponse.json(formattedAccounts)
  } catch (error) {
    console.error('Error fetching token accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch token accounts' },
      { status: 500 }
    )
  }
} 