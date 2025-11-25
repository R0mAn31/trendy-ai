import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { getVideoIdeasCollectionPath } from '@/lib/firebase/collections'
import { FieldValue } from 'firebase-admin/firestore'
import type { VideoIdea } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { trendId: string } }
) {
  try {
    const { trendId } = params
    const body = await request.json()
    const { userId, ideas } = body

    if (!userId || !ideas || !Array.isArray(ideas)) {
      return NextResponse.json(
        { error: 'userId and ideas array are required' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()
    const ideasRef = adminDb.collection(getVideoIdeasCollectionPath(userId, trendId))

    // Save each idea
    const savedIdeas = []
    for (const idea of ideas) {
      const ideaData: Omit<VideoIdea, 'id'> = {
        title: idea.title,
        script: idea.script,
        hashtags: idea.hashtags || [],
        audioSuggestion: idea.audioSuggestion,
        postingTime: idea.postingTime,
        format: idea.format,
        trendId,
        userId,
        createdAt: new Date(),
      }

      const docRef = ideasRef.doc()
      await docRef.set({
        ...ideaData,
        createdAt: FieldValue.serverTimestamp(),
      })

      savedIdeas.push({
        id: docRef.id,
        ...ideaData,
      })
    }

    return NextResponse.json({
      success: true,
      ideas: savedIdeas,
    })
  } catch (error: any) {
    console.error('Save ideas error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save ideas' },
      { status: 500 }
    )
  }
}

