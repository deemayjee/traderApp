interface UserProfile {
  username: string
  email: string
  avatar_url: string | null
}

export function getUserDisplayInfo(profile: UserProfile | null) {
  if (!profile) {
    return {
      displayName: 'Anonymous',
      avatarUrl: null,
      email: null
    }
  }

  return {
    displayName: profile.username || 'Anonymous',
    avatarUrl: profile.avatar_url,
    email: profile.email
  }
} 