import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount
} from "@solana/spl-token";
import { BN } from "bn.js";

export interface TokenLockParams {
  userWallet: string;
  tokenMint: string;
  amount: number;
  lockPeriod: number; // in days
  decimals: number;
}

export interface TokenLockResult {
  lockId: string;
  pdaAddress: string;
  signature: string;
  unlockTime: number; // Unix timestamp when tokens can be unlocked
}

export class TokenLockService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  // Generate a PDA for the token lock
  private async findTokenLockPDA(
    userWallet: PublicKey,
    tokenMint: PublicKey,
    lockId: string
  ): Promise<[PublicKey, number]> {
    const seeds = [
      Buffer.from("token_lock"),
      userWallet.toBuffer(),
      tokenMint.toBuffer(),
      Buffer.from(lockId)
    ];
    return PublicKey.findProgramAddressSync(seeds, TOKEN_PROGRAM_ID);
  }

  // Create a new token lock
  async createTokenLock(
    params: TokenLockParams,
    aiWallet: Keypair // AI wallet keypair
  ): Promise<TokenLockResult> {
    const {
      userWallet, // still needed for PDA derivation
      tokenMint,
      amount,
      lockPeriod,
      decimals
    } = params;

    // Generate a unique lock ID
    const lockId = new Date().getTime().toString();
    
    // Calculate unlock time (current time + lock period in milliseconds)
    const unlockTime = Date.now() + (lockPeriod * 24 * 60 * 60 * 1000);
    
    // Convert addresses to PublicKey objects
    const userWalletPubkey = new PublicKey(userWallet);
    const tokenMintPubkey = new PublicKey(tokenMint);

    // Find PDA for the token lock
    const [pdaAddress] = await this.findTokenLockPDA(
      userWalletPubkey,
      tokenMintPubkey,
      lockId
    );

    // Use AI wallet for transfer
    const aiWalletPubkey = aiWallet.publicKey;
    const aiATA = await getAssociatedTokenAddress(tokenMintPubkey, aiWalletPubkey);
    const pdaATA = await getAssociatedTokenAddress(tokenMintPubkey, pdaAddress, true);

    // Fetch the AI wallet's token account balance
    console.log(`AI Wallet Public Key: ${aiWalletPubkey.toBase58()}`);
    console.log(`Token Mint: ${tokenMintPubkey.toBase58()}`);
    console.log(`Token decimals used: ${decimals}`);
    const aiTokenAccount = await getAccount(this.connection, aiATA);
    console.log(`AI wallet raw token amount: ${aiTokenAccount.amount}`);
    console.log(`AI Token Lock: Amount to transfer: ${amount} raw units`);
    console.log(`AI Token Lock: AI wallet token account balance: ${aiTokenAccount.amount} raw units`);

    // Create transaction
    const transaction = new Transaction();

    // Create PDA's associated token account if it doesn't exist
    transaction.add(
      createAssociatedTokenAccountInstruction(
        aiWalletPubkey,
        pdaATA,
        pdaAddress,
        tokenMintPubkey
      )
    );

    // Transfer tokens to PDA
    // Amount is already in raw units from the AI trade
    const amountBN = new BN(amount.toString());
    transaction.add(
      createTransferInstruction(
        aiATA,
        pdaATA,
        aiWalletPubkey,
        BigInt(amountBN.toString()) // Convert to BigInt to preserve precision
      )
    );

    // Send transaction
    const signature = await this.connection.sendTransaction(
      transaction,
      [aiWallet],
      { 
        skipPreflight: false,
        maxRetries: 3,
        preflightCommitment: 'confirmed'
      }
    );

    // Wait for confirmation with a longer timeout
    try {
      const latestBlockhash = await this.connection.getLatestBlockhash('confirmed');
      await this.connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
      }, 'confirmed');
    } catch (confirmError) {
      console.warn("Transaction confirmation timeout, but may still succeed:", confirmError);
      // Don't throw here - the transaction might still succeed
    }

    return {
      lockId,
      pdaAddress: pdaAddress.toBase58(),
      signature,
      unlockTime
    };
  }

  // Check if tokens are still locked
  async isLocked(
    pdaAddress: string,
    tokenMint: string,
    lockEndDate: string
  ): Promise<boolean> {
    try {
      const pdaPubkey = new PublicKey(pdaAddress);
      const tokenMintPubkey = new PublicKey(tokenMint);
      
      // Get PDA's associated token account
      const pdaATA = await getAssociatedTokenAddress(
        tokenMintPubkey,
        pdaPubkey,
        true
      );

      // Get token account info
      const tokenAccount = await getAccount(this.connection, pdaATA);
      
      // Use the actual end_date from the trade
      const currentTime = Date.now();
      const unlockTime = new Date(lockEndDate).getTime();
      console.log('[TokenLockService.isLocked]', {
        pdaAddress: pdaAddress,
        tokenMint: tokenMint,
        currentTime,
        unlockTime,
        tokenAccountAmount: tokenAccount.amount
      });
      return tokenAccount.amount > 0 && currentTime < unlockTime;
    } catch (error) {
      console.error("Error checking lock status:", error);
      return false;
    }
  }

  // Release locked tokens
  async releaseTokens(
    pdaAddress: string,
    tokenMint: string,
    recipient: string,
    wallet: Keypair,
    lockPeriod: number
  ): Promise<string> {
    const pdaPubkey = new PublicKey(pdaAddress);
    const tokenMintPubkey = new PublicKey(tokenMint);
    const recipientPubkey = new PublicKey(recipient);

    // Check if lock period has passed
    const currentTime = Date.now();
    const unlockTime = currentTime + (lockPeriod * 24 * 60 * 60 * 1000);
    
    if (currentTime < unlockTime) {
      throw new Error("Tokens are still locked. Cannot release before lock period ends.");
    }

    // Get associated token accounts
    const pdaATA = await getAssociatedTokenAddress(
      tokenMintPubkey,
      pdaPubkey,
      true
    );
    const recipientATA = await getAssociatedTokenAddress(
      tokenMintPubkey,
      recipientPubkey
    );

    // Create transaction
    const transaction = new Transaction();

    // Transfer tokens from PDA to recipient
    transaction.add(
      createTransferInstruction(
        pdaATA,
        recipientATA,
        pdaPubkey,
        Number.MAX_SAFE_INTEGER // Transfer all tokens
      )
    );

    // Send transaction
    const signature = await this.connection.sendTransaction(
      transaction,
      [wallet],
      { skipPreflight: false }
    );

    // Wait for confirmation
    await this.connection.confirmTransaction(signature);

    return signature;
  }

  // Get remaining lock time in days
  async getRemainingLockTime(
    pdaAddress: string,
    lockEndDate: string
  ): Promise<number> {
    const currentTime = Date.now();
    const unlockTime = new Date(lockEndDate).getTime();
    const remainingTime = unlockTime - currentTime;
    return Math.max(0, remainingTime / (24 * 60 * 60 * 1000)); // Convert to days
  }
} 