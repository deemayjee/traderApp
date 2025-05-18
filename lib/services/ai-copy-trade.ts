import { executeTrade } from "@/app/api/copy-trading/start/route";

export async function executeAIWalletCopyTrade({
  userWallet,
  inputTokenAddress,
  outputTokenAddress,
  aiAmount,
  inputDecimals,
  outputDecimals
}: {
  userWallet: string,
  inputTokenAddress: string,
  outputTokenAddress: string,
  aiAmount: number,
  inputDecimals: number,
  outputDecimals: number
}) {
  return await executeTrade(
    userWallet,
    {
      inputTokenAddress,
      outputTokenAddress,
      inputAmount: aiAmount,
      inputDecimals,
      outputDecimals
    },
    true // isAITrade
  );
} 