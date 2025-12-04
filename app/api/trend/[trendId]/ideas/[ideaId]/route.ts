import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { getVideoIdeaDocPath } from '@/lib/firebase/collections'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { trendId: string; ideaId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const { trendId, ideaId } = params
    const adminDb = getAdminDb()

    const ideaRef = adminDb.doc(getVideoIdeaDocPath(userId, trendId, ideaId))
    const ideaDoc = await ideaRef.get()

    if (!ideaDoc.exists) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
    }

    await ideaRef.delete()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete idea error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete idea' },
      { status: 500 }
    )
  }
}



