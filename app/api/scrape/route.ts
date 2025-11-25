import { NextRequest, NextResponse } from 'next/server'
import { scrapeTikTokAccount } from '@/lib/scraper/tiktok'
import { adminDb } from '@/lib/firebase/admin'
import { getSavedTrendDocPath, getSavedTrendsCollectionPath } from '@/lib/firebase/collections'
import { doc, setDoc, serverTimestamp } from 'firebase-admin/firestore'
import type { TikTokTrend } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { username, userId } = await request.json()

    if (!username || !userId) {
      return NextResponse.json(
        { error: 'Username and userId are required' },
        { status: 400 }
      )
    }

    // Scrape TikTok account
    const scrapedData = await scrapeTikTokAccount(username)

    // Save to Firestore
    const trendRef = doc(
      adminDb,
      getSavedTrendsCollectionPath(userId),
      `${username}_${Date.now()}`
    )

    const trendData: Omit<TikTokTrend, 'id'> = {
      userId,
      accountUsername: scrapedData.accountUsername,
      accountDisplayName: scrapedData.accountDisplayName,
      followers: scrapedData.followers,
      likes: scrapedData.likes,
      views: scrapedData.views,
      videoCount: scrapedData.videoCount,
      hashtags: scrapedData.hashtags,
      audioTracks: scrapedData.audioTracks,
      lastScrapedAt: scrapedData.lastScrapedAt,
      createdAt: new Date(),
    }

    await setDoc(trendRef, {
      ...trendData,
      createdAt: serverTimestamp(),
      lastScrapedAt: serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      trend: {
        id: trendRef.id,
        ...trendData,
      },
    })
  } catch (error) {
    console.error('Scrape API error:', error)
    return NextResponse.json(
      { error: 'Failed to scrape TikTok account' },
      { status: 500 }
    )
  }
}

