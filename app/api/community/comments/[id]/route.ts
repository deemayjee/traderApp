import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server-admin'

export const dynamic = 'force-dynamic' // This ensures the route is dynamic

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Delete the comment
    const { error } = await supabaseAdmin
      .from('community_comments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting comment:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/community/comments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
} 