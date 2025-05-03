import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables")
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json(
        { error: "No code provided" },
        { status: 400 }
      )
    }

    // First check if the code exists and is active
    const { data: checkData, error: checkError } = await supabase
      .from('beta_access_codes')
      .select('is_active')
      .eq('code', code)
      .single()

    if (checkError) {
      console.error('Error verifying access code:', checkError)
      return NextResponse.json(
        { error: "Failed to verify code" },
        { status: 500 }
      )
    }

    if (!checkData?.is_active) {
      return NextResponse.json({ isValid: false })
    }

    // If code is valid, deactivate it
    const { error: deactivateError } = await supabase
      .from('beta_access_codes')
      .update({ is_active: false })
      .eq('code', code)

    if (deactivateError) {
      console.error('Error deactivating access code:', deactivateError)
      return NextResponse.json(
        { error: "Failed to deactivate code" },
        { status: 500 }
      )
    }

    return NextResponse.json({ isValid: true })
  } catch (error) {
    console.error('Error in beta access verification:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 