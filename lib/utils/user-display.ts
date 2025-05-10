import type { UserProfile } from "@/lib/types/settings"

export function getUserDisplayInfo(profile: UserProfile | null, walletAddress?: string) {
  const username = profile?.username
  const avatar = profile?.avatar_url
  const address = walletAddress || profile?.user_id

  // Generate a friendly default name if no username exists
  const getDefaultName = (addr: string) => {
    const shortAddr = `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}`
    return `User ${shortAddr}`
  }

  // Generate a friendly default handle if no username exists
  const getDefaultHandle = (addr: string) => {
    return `@user${addr.substring(0, 4).toLowerCase()}`
  }

  return {
    name: username || (address ? getDefaultName(address) : "Anonymous"),
    handle: username 
      ? `@${username.toLowerCase().replace(/\s+/g, "")}` 
      : address 
        ? getDefaultHandle(address)
        : "@anonymous",
    avatar: avatar || "/placeholder.svg",
    walletAddress: address
  }
} 