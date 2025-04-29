import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const walletAddress = formData.get('walletAddress') as string
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
    }
    
    const supabase = createClient()
    
    // Upload file to storage
    const fileName = `${walletAddress}-${Date.now()}.${file.name.split('.').pop()}`
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (error) {
      console.error('Error uploading file:', error)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName)
    
    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: publicUrl })
      .eq('wallet_address', walletAddress)
    
    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, avatarUrl: publicUrl })
  } catch (error) {
    console.error('Error in profile picture upload:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
    }
    
    const supabase = createClient()
    
    // Get current avatar URL to delete from storage
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('wallet_address', walletAddress)
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user data:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }
    
    // If user has an avatar, delete it from storage
    if (userData?.avatar_url) {
      // Extract file name from URL
      const fileName = userData.avatar_url.split('/').pop()
      
      if (fileName) {
        // Delete file from storage (ignoring errors if file doesn't exist)
        await supabase.storage
          .from('profile-pictures')
          .remove([fileName])
      }
    }
    
    // Update user profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: null })
      .eq('wallet_address', walletAddress)
    
    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in profile picture removal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 