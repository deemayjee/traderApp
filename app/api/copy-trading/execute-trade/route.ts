import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server-admin"
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Initialize Solana connection
const connection = new Connection(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  'confirmed'
)

export async function POST(req: Request) {
  try {
    console.log("Received trade execution request")
    const { trade, allocation, maxSlippage, stopLoss } = await req.json()

    // Validate trade data
    if (!trade || !trade.walletAddress || !trade.type || !trade.token || !trade.amount) {
      console.error("Invalid trade data:", trade)
      return NextResponse.json(
        { error: "Invalid trade data. Required fields: walletAddress, type, token, amount" },
        { status: 400 }
      )
    }

    // Validate allocation
    if (!allocation || allocation <= 0) {
      console.error("Invalid allocation:", allocation)
      return NextResponse.json(
        { error: "Invalid allocation amount" },
        { status: 400 }
      )
    }

    console.log("Trade execution parameters:", {
      trade,
      allocation,
      maxSlippage,
      stopLoss
    })

    // Validate wallet address
    let walletPubkey: PublicKey;
    try {
      walletPubkey = new PublicKey(trade.walletAddress);
    } catch (error) {
      console.error("Invalid wallet address:", trade.walletAddress);
      return NextResponse.json(
        { error: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    // Get wallet balance
    const walletBalance = await connection.getBalance(walletPubkey);
    const balanceInSol = walletBalance / LAMPORTS_PER_SOL;
    
    console.log("Wallet balance:", {
      address: trade.walletAddress,
      balance: balanceInSol,
      required: allocation
    });

    // Check if wallet has sufficient balance
    if (balanceInSol < allocation + 0.01) { // Add 0.01 SOL for transaction fees
      const error = `Insufficient balance. Required: ${allocation + 0.01} SOL, Available: ${balanceInSol} SOL`;
      console.error(error);
      return NextResponse.json(
        { error },
        { status: 400 }
      );
    }

    // Calculate adjusted allocation (95% of available balance to account for price movements)
    const adjustedAllocation = Math.min(allocation, (balanceInSol - 0.01) * 0.95);
    
    console.log("Adjusted allocation:", {
      original: allocation,
      adjusted: adjustedAllocation,
      availableBalance: balanceInSol
    });

    // Execute trade with retry logic
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Executing trade attempt ${attempt}/${MAX_RETRIES}`);

        // Create and send transaction
        const transaction = new Transaction();
        
        // Add token transfer instruction based on trade type
        if (trade.type === 'buy') {
          // For buy orders, we'll create a token purchase instruction
          const tokenMint = new PublicKey(trade.token);
          // Add your token purchase logic here
          // This will depend on the DEX or trading platform you're using
        } else {
          // For sell orders, we'll create a token sale instruction
          const tokenMint = new PublicKey(trade.token);
          // Add your token sale logic here
          // This will depend on the DEX or trading platform you're using
        }

        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = walletPubkey;

        // Return the transaction for the client to sign
        const serializedTransaction = transaction.serialize().toString('base64');

        if (!supabaseAdmin) {
          throw new Error("Database connection not initialized");
        }

        // Record trade in database
        const { error: dbError } = await supabaseAdmin
          .from("trades")
          .insert({
            trader_address: trade.walletAddress,
            token_address: trade.token,
            amount: trade.amount,
            price: trade.price,
            type: trade.type,
            status: "pending",
            allocation: adjustedAllocation,
            original_allocation: allocation,
            stop_loss: stopLoss,
            max_slippage: maxSlippage
          });

        if (dbError) {
          console.error("Database error:", dbError);
          throw new Error("Failed to record trade in database");
        }

        return NextResponse.json({
          success: true,
          transaction: serializedTransaction,
          allocation: adjustedAllocation,
          originalAllocation: allocation
        });

      } catch (error) {
        console.error(`Trade execution attempt ${attempt} failed:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY}ms...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    // If all retries failed
    console.error("All trade execution attempts failed:", lastError);
    return NextResponse.json(
      { error: `Trade execution failed after ${MAX_RETRIES} attempts: ${lastError?.message || "Unknown error"}` },
      { status: 500 }
    );

  } catch (error) {
    console.error("Trade execution error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Trade execution failed: ${errorMessage}` },
      { status: 500 }
    );
  }
} 