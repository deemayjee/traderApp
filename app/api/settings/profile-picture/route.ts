import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

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

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not supported. Please upload a JPEG, PNG, GIF, or WebP image.' }, { status: 400 })
    }
    
    const supabase = createClient()
    
    // Generate a unique filename
    const fileExtension = file.name.split('.').pop()
    const fileName = `${walletAddress}-${Date.now()}.${fileExtension}`
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Upload file to storage
    console.log('Attempting to upload file:', fileName)
    const { data, error } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      })
    
    if (error) {
      console.error('Error uploading file:', error)
      return NextResponse.json({ 
        error: 'Failed to upload file',
        details: error.message 
      }, { status: 500 })
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName)
    
    console.log('File uploaded successfully. Public URL:', publicUrl)
    
    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: publicUrl })
      .eq('wallet_address', walletAddress)
    
    if (updateError) {
      console.error('Error updating user profile:', updateError)
      // Try to delete the uploaded file if profile update fails
      await supabase.storage
        .from('profile-pictures')
        .remove([fileName])
      return NextResponse.json({ 
        error: 'Failed to update profile',
        details: updateError.message 
      }, { status: 500 })
    }
    
    // Verify the update was successful
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('avatar_url')
      .eq('wallet_address', walletAddress)
      .single()
    
    if (verifyError) {
      console.error('Error verifying profile update:', verifyError)
      return NextResponse.json({ 
        error: 'Failed to verify profile update',
        details: verifyError.message 
      }, { status: 500 })
    }
    
    console.log('Updated profile:', updatedProfile)
    
    return NextResponse.json({ 
      success: true, 
      avatarUrl: updatedProfile.avatar_url 
    })
  } catch (error) {
    console.error('Error in profile picture upload:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
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
      .from('user_profiles')
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
      .from('user_profiles')
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