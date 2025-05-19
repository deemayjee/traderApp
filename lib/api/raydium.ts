import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { getAssociatedTokenAddress } from '@solana/spl-token'

// Raydium program IDs
const RAYDIUM_SWAP_PROGRAM_ID = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8')
const RAYDIUM_LIQUIDITY_POOL_PROGRAM_ID = new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8')

interface RaydiumPoolInfo {
  id: string
  baseMint: string
  quoteMint: string
  lpMint: string
  baseDecimals: number
  quoteDecimals: number
  lpDecimals: number
  version: number
  programId: string
  authority: string
  openOrders: string
  targetOrders: string
  baseVault: string
  quoteVault: string
  withdrawQueue: string
  lpVault: string
  marketVersion: number
  marketProgramId: string
  marketId: string
  marketAuthority: string
  marketBaseVault: string
  marketQuoteVault: string
  marketBids: string
  marketAsks: string
  marketEventQueue: string
}

interface RaydiumQuote {
  inputAmount: number
  outputAmount: number
  priceImpact: number
  poolInfo: RaydiumPoolInfo
}

export async function getRaydiumQuote(
  connection: Connection,
  inputMint: PublicKey,
  outputMint: PublicKey,
  amount: number,
  decimals: number
): Promise<RaydiumQuote> {
  try {
    // Get all Raydium pools for the token pair
    const pools = await getRaydiumPools(connection, inputMint, outputMint)
    
    if (pools.length === 0) {
      throw new Error('No Raydium pools found for this token pair')
    }

    // Find the pool with the best price
    let bestPool: RaydiumPoolInfo | null = null
    let bestOutputAmount = 0
    let bestPriceImpact = 1

    for (const pool of pools) {
      const quote = await calculateRaydiumQuote(connection, pool, amount, decimals)
      if (quote.outputAmount > bestOutputAmount) {
        bestPool = pool
        bestOutputAmount = quote.outputAmount
        bestPriceImpact = quote.priceImpact
      }
    }

    if (!bestPool) {
      throw new Error('Failed to find a suitable Raydium pool')
    }

    return {
      inputAmount: amount,
      outputAmount: bestOutputAmount,
      priceImpact: bestPriceImpact,
      poolInfo: bestPool
    }
  } catch (error) {
    console.error('Error getting Raydium quote:', error)
    throw error
  }
}

async function getRaydiumPools(
  connection: Connection,
  inputMint: PublicKey,
  outputMint: PublicKey
): Promise<RaydiumPoolInfo[]> {
  try {
    // Get all program accounts for Raydium swap program
    const accounts = await connection.getProgramAccounts(RAYDIUM_SWAP_PROGRAM_ID, {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: inputMint.toBase58()
          }
        },
        {
          memcmp: {
            offset: 32,
            bytes: outputMint.toBase58()
          }
        }
      ]
    })

    return accounts.map(account => {
      const data = account.account.data
      return {
        id: account.pubkey.toString(),
        baseMint: new PublicKey(data.slice(0, 32)).toString(),
        quoteMint: new PublicKey(data.slice(32, 64)).toString(),
        lpMint: new PublicKey(data.slice(64, 96)).toString(),
        baseDecimals: data[96],
        quoteDecimals: data[97],
        lpDecimals: data[98],
        version: data[99],
        programId: new PublicKey(data.slice(100, 132)).toString(),
        authority: new PublicKey(data.slice(132, 164)).toString(),
        openOrders: new PublicKey(data.slice(164, 196)).toString(),
        targetOrders: new PublicKey(data.slice(196, 228)).toString(),
        baseVault: new PublicKey(data.slice(228, 260)).toString(),
        quoteVault: new PublicKey(data.slice(260, 292)).toString(),
        withdrawQueue: new PublicKey(data.slice(292, 324)).toString(),
        lpVault: new PublicKey(data.slice(324, 356)).toString(),
        marketVersion: data[356],
        marketProgramId: new PublicKey(data.slice(357, 389)).toString(),
        marketId: new PublicKey(data.slice(389, 421)).toString(),
        marketAuthority: new PublicKey(data.slice(421, 453)).toString(),
        marketBaseVault: new PublicKey(data.slice(453, 485)).toString(),
        marketQuoteVault: new PublicKey(data.slice(485, 517)).toString(),
        marketBids: new PublicKey(data.slice(517, 549)).toString(),
        marketAsks: new PublicKey(data.slice(549, 581)).toString(),
        marketEventQueue: new PublicKey(data.slice(581, 613)).toString()
      }
    })
  } catch (error) {
    console.error('Error getting Raydium pools:', error)
    throw error
  }
}

async function calculateRaydiumQuote(
  connection: Connection,
  pool: RaydiumPoolInfo,
  amount: number,
  decimals: number
): Promise<{ outputAmount: number; priceImpact: number }> {
  try {
    // Get pool balances
    const [baseVault, quoteVault] = await Promise.all([
      connection.getTokenAccountBalance(new PublicKey(pool.baseVault)),
      connection.getTokenAccountBalance(new PublicKey(pool.quoteVault))
    ])

    const baseReserve = Number(baseVault.value.amount) / Math.pow(10, baseVault.value.decimals)
    const quoteReserve = Number(quoteVault.value.amount) / Math.pow(10, quoteVault.value.decimals)

    // Calculate output amount using constant product formula
    const inputAmount = amount * Math.pow(10, decimals)
    const outputAmount = (quoteReserve * inputAmount) / (baseReserve + inputAmount)

    // Calculate price impact
    const spotPrice = quoteReserve / baseReserve
    const executionPrice = outputAmount / amount
    const priceImpact = Math.abs(1 - (executionPrice / spotPrice))

    return {
      outputAmount: outputAmount / Math.pow(10, decimals),
      priceImpact
    }
  } catch (error) {
    console.error('Error calculating Raydium quote:', error)
    throw error
  }
}

export async function createRaydiumSwapTransaction(
  connection: Connection,
  pool: RaydiumPoolInfo,
  userPublicKey: PublicKey,
  inputMint: PublicKey,
  outputMint: PublicKey,
  amount: number,
  decimals: number
): Promise<Transaction> {
  try {
    const transaction = new Transaction()

    // Get associated token accounts
    const [inputATA, outputATA] = await Promise.all([
      getAssociatedTokenAddress(inputMint, userPublicKey),
      getAssociatedTokenAddress(outputMint, userPublicKey)
    ])

    // Add Raydium swap instruction
    transaction.add({
      programId: RAYDIUM_SWAP_PROGRAM_ID,
      keys: [
        { pubkey: userPublicKey, isSigner: true, isWritable: true },
        { pubkey: new PublicKey(pool.id), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(pool.authority), isSigner: false, isWritable: false },
        { pubkey: new PublicKey(pool.openOrders), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(pool.targetOrders), isSigner: false, isWritable: true },
        { pubkey: inputATA, isSigner: false, isWritable: true },
        { pubkey: outputATA, isSigner: false, isWritable: true },
        { pubkey: new PublicKey(pool.baseVault), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(pool.quoteVault), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(pool.marketId), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(pool.marketBids), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(pool.marketAsks), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(pool.marketEventQueue), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(pool.marketBaseVault), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(pool.marketQuoteVault), isSigner: false, isWritable: true },
        { pubkey: new PublicKey(pool.marketAuthority), isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      data: Buffer.from([
        1, // instruction index for swap
        ...new Uint8Array(Buffer.alloc(8)).fill(amount * Math.pow(10, decimals))
      ])
    })

    return transaction
  } catch (error) {
    console.error('Error creating Raydium swap transaction:', error)
    throw error
  }
} 