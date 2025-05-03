import { NextResponse } from "next/server"
import { SettingsService } from "@/lib/services/settings"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const settingsService = new SettingsService()
const supabase = createClient()

export const dynamic = 'force-dynamic' // This ensures the route is dynamic

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.address) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await settingsService.getUserSettings(session.user.address)
    if (!settings) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Error in GET /api/settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.address) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json({ error: "Settings are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', session.user.address)
      .select()
      .single()

    if (error) {
      console.error("Error updating settings:", error)
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PUT /api/settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 