import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server-admin"

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available')
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: "No code provided" },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('beta_access_codes')
      .update({ is_active: false })
      .eq('code', code)

    if (error) {
      console.error('Error deactivating access code:', error)
      return NextResponse.json(
        { error: "Failed to deactivate code" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in beta access code deactivation:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 