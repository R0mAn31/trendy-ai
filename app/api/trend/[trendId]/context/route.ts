import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { getTrendContextDocPath } from '@/lib/firebase/collections'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(
  request: NextRequest,
  { params }: { params: { trendId: string } }
) {
  try {
    const { trendId } = params
    const body = await request.json()
    const { userId, notes } = body

    if (!userId || notes === undefined) {
      return NextResponse.json(
        { error: 'userId and notes are required' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()
    const contextRef = adminDb.doc(getTrendContextDocPath(userId, trendId))

    const contextData = {
      userId,
      trendId,
      notes: notes || '',
      updatedAt: FieldValue.serverTimestamp(),
    }

    const contextDoc = await contextRef.get()
    
    if (contextDoc.exists) {
      // Update existing context
      await contextRef.update(contextData)
    } else {
      // Create new context
      await contextRef.set({
        ...contextData,
        createdAt: FieldValue.serverTimestamp(),
      })
    }

    return NextResponse.json({
      success: true,
      context: {
        id: contextRef.id,
        ...contextData,
      },
    })
  } catch (error: any) {
    console.error('Save context error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save context' },
      { status: 500 }
    )
  }
}

