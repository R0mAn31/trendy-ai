import { NextRequest, NextResponse } from 'next/server'
import { analyzeTikTokTrend, generateVideoIdeas } from '@/lib/gemini/client'
import { getAdminDb } from '@/lib/firebase/admin'
import {
  getSavedTrendDocPath,
  getAnalysisDocPath,
  getAnalysisCollectionPath,
} from '@/lib/firebase/collections'
import { FieldValue } from 'firebase-admin/firestore'
import type { AIAnalysis } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { trendId, userId, generateIdeas } = await request.json()

    if (!trendId || !userId) {
      return NextResponse.json(
        { error: 'trendId and userId are required' },
        { status: 400 }
      )
    }

    // Get trend data
    const adminDb = getAdminDb()
    const trendRef = adminDb.doc(getSavedTrendDocPath(userId, trendId))
    const trendDoc = await trendRef.get()

    if (!trendDoc.exists) {
      return NextResponse.json({ error: 'Trend not found' }, { status: 404 })
    }

    const trendData = trendDoc.data()

    if (generateIdeas) {
      // Generate video ideas
      const ideas = await generateVideoIdeas(trendData as any, 10)
      return NextResponse.json(ideas)
    } else {
      // Generate AI analysis
      const recommendations = await analyzeTikTokTrend(trendData as any)

      // Save analysis to Firestore
      const analysisId = `${trendId}_${Date.now()}`
      const analysisRef = adminDb.doc(getAnalysisDocPath(userId, analysisId))

      const analysisData: Omit<AIAnalysis, 'id'> = {
        userId,
        trendId,
        recommendations,
        generatedAt: new Date(),
      }

      await analysisRef.set({
        ...analysisData,
        generatedAt: FieldValue.serverTimestamp(),
      })

      return NextResponse.json({
        id: analysisId,
        ...analysisData,
      })
    }
  } catch (error) {
    console.error('Analyze API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    )
  }
}

