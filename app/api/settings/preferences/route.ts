import { NextResponse } from "next/server"
import { SettingsService } from "@/lib/services/settings"
import type { UserPreferences } from "@/lib/types/settings"
import { verifySignature } from "@/lib/utils/auth"

const settingsService = new SettingsService()

export async function GET(request: Request) {
  try {
    const { publicKey, signature } = await verifySignature(request)
    if (!publicKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const preferences = await settingsService.getPreferences(publicKey)
    if (!preferences) {
      return NextResponse.json({ error: "Preferences not found" }, { status: 404 })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error("Error in GET /api/settings/preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { publicKey, signature } = await verifySignature(request)
    if (!publicKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const preferences: Partial<UserPreferences> = {
      theme: body.theme,
      language: body.language,
      currency: body.currency,
      compact_mode: body.compact_mode,
      show_advanced_charts: body.show_advanced_charts,
      enable_animations: body.enable_animations
    }

    const updatedPreferences = await settingsService.updatePreferences(publicKey, preferences)
    if (!updatedPreferences) {
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 })
    }

    return NextResponse.json(updatedPreferences)
  } catch (error) {
    console.error("Error in PUT /api/settings/preferences:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 