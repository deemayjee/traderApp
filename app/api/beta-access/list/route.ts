import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server-admin"

export async function GET() {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not available')
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('beta_access_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching access codes:', error)
      return NextResponse.json(
        { error: "Failed to fetch codes" },
        { status: 500 }
      )
    }

    return NextResponse.json({ codes: data })
  } catch (error) {
    console.error('Error in beta access code listing:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 