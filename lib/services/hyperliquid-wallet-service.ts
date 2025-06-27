import { ethers } from 'ethers'

// Hyperliquid EVM configuration
export const HYPERLIQUID_EVM_CONFIG = {
  chainId: 999,
  name: 'Hyperliquid EVM',
  rpcUrl: 'https://rpc.hyperliquid.xyz/evm',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
  blockExplorer: 'https://hyperfoundation.org'
}

export class HyperliquidWalletService {
  private provider: ethers.JsonRpcProvider
  
  constructor() {
    this.provider = new ethers.JsonRpcProvider(HYPERLIQUID_EVM_CONFIG.rpcUrl)
  }

  /**
   * Get wallet balance in HYPE tokens
   */
  async getWalletBalance(walletAddress: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(walletAddress)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error("Error getting wallet balance:", error)
      throw new Error("Failed to get wallet balance")
    }
  }

  /**
   * Validate Ethereum address format
   */
  isValidEthereumAddress(address: string): boolean {
    return ethers.isAddress(address)
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData()
      return feeData.gasPrice || BigInt(0)
    } catch (error) {
      console.error("Error getting gas price:", error)
      throw new Error("Failed to get gas price")
    }
  }

  /**
   * Get transaction count (nonce) for address
   */
  async getTransactionCount(address: string): Promise<number> {
    try {
      return await this.provider.getTransactionCount(address)
    } catch (error) {
      console.error("Error getting transaction count:", error)
      throw new Error("Failed to get transaction count")
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork()
      return {
        chainId: Number(network.chainId),
        name: network.name
      }
    } catch (error) {
      console.error("Error getting network info:", error)
      throw new Error("Failed to get network info")
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<ethers.TransactionReceipt | null> {
    try {
      return await this.provider.waitForTransaction(txHash, confirmations)
    } catch (error) {
      console.error("Error waiting for transaction:", error)
      throw new Error("Failed to wait for transaction")
    }
  }
}

export const hyperliquidWalletService = new HyperliquidWalletService() 