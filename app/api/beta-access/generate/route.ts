import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server-admin"

export async function POST() {
  try {
    // Generate a random 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    // Insert the code using the admin client
    const { error } = await supabaseAdmin
      .from('beta_access_codes')
      .insert([{
        code,
        is_active: true
      }])

    if (error) {
      console.error('Error creating access code:', error)
      return NextResponse.json(
        { error: "Failed to generate code" },
        { status: 500 }
      )
    }

    return NextResponse.json({ code })
  } catch (error) {
    console.error('Error in beta access code generation:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 