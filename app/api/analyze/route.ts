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
    const body = await request.json()
    const { trendId, userId, generateIdeas } = body

    console.log('Analyze API called:', { trendId, userId, generateIdeas })

    if (!trendId || !userId) {
      return NextResponse.json(
        { error: 'trendId and userId are required' },
        { status: 400 }
      )
    }

    // Check if Gemini API key is set
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set')
      return NextResponse.json(
        { error: 'AI service is not configured. Please set GEMINI_API_KEY.' },
        { status: 500 }
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
    console.log('Trend data retrieved:', { 
      username: trendData?.accountUsername,
      followers: trendData?.followers 
    })

    if (generateIdeas) {
      // Generate video ideas
      console.log('Generating video ideas...')
      const ideas = await generateVideoIdeas(trendData as any, 10)
      console.log('Video ideas generated:', ideas.length)
      return NextResponse.json({ success: true, ideas })
    } else {
      // Generate AI analysis
      console.log('Generating AI analysis...')
      const recommendations = await analyzeTikTokTrend(trendData as any)
      console.log('Analysis generated:', Object.keys(recommendations))

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
        success: true,
        id: analysisId,
        ...analysisData,
      })
    }
  } catch (error: any) {
    console.error('Analyze API error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate analysis',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

