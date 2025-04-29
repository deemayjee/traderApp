import { NextResponse } from "next/server"
import { SettingsService } from "@/lib/services/settings"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { UserProfile } from "@/lib/types/settings"

const settingsService = new SettingsService()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await settingsService.getProfile(session.user.id)
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error in GET /api/settings/profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const profile: Partial<UserProfile> = {
      name: body.name,
      email: body.email,
      bio: body.bio,
      username: body.username,
      avatar_url: body.avatar_url,
      phone_number: body.phone_number,
      timezone: body.timezone,
      public_profile: body.public_profile
    }

    const updatedProfile = await settingsService.updateProfile(session.user.id, profile)
    if (!updatedProfile) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error("Error in PUT /api/settings/profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 