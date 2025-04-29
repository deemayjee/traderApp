import type { UserProfile } from "@/contexts/user-profile-context"

export function getUserDisplayInfo(profile: UserProfile | null, walletAddress?: string) {
  const username = profile?.username
  const avatar = profile?.avatar_url
  const address = walletAddress || profile?.wallet_address

  return {
    name: username || (address ? `User ${address.substring(0, 4)}...${address.substring(address.length - 4)}` : "Anonymous"),
    handle: username 
      ? `@${username.toLowerCase().replace(/\s+/g, "")}` 
      : address 
        ? `@${address.substring(0, 8)}` 
        : "@anonymous",
    avatar: avatar || "/placeholder.svg",
    walletAddress: address
  }
} 