import { NextRequest, NextResponse } from 'next/server'
import { analyzeTikTokTrend, generateVideoIdeas } from '@/lib/gemini/client'
import { adminDb } from '@/lib/firebase/admin'
import {
  getSavedTrendDocPath,
  getAnalysisDocPath,
  getAnalysisCollectionPath,
} from '@/lib/firebase/collections'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase-admin/firestore'
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
    const trendRef = doc(adminDb, getSavedTrendDocPath(userId, trendId))
    const trendDoc = await getDoc(trendRef)

    if (!trendDoc.exists()) {
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

      const analysisData: Omit<AIAnalysis, 'id'> = {
        userId,
        trendId,
        recommendations,
        generatedAt: new Date(),
      }

      await setDoc(doc(adminDb, getAnalysisDocPath(userId, analysisId)), {
        ...analysisData,
        generatedAt: serverTimestamp(),
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

