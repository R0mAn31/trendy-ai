import { NextRequest, NextResponse } from 'next/server'
import { scrapeTikTokAccount } from '@/lib/scraper/tiktok'
import { getAdminDb } from '@/lib/firebase/admin'
import { getSavedTrendsCollectionPath } from '@/lib/firebase/collections'
import { FieldValue } from 'firebase-admin/firestore'
import type { TikTokTrend } from '@/types'

export async function POST(request: NextRequest) {
  let username: string | undefined
  
  try {
    const body = await request.json()
    username = body.username
    const userId = body.userId

    if (!username || !userId) {
      return NextResponse.json(
        { error: 'Username and userId are required' },
        { status: 400 }
      )
    }

    // Scrape TikTok account
    const scrapedData = await scrapeTikTokAccount(username)

    // Save to Firestore
    const adminDb = getAdminDb()
    const trendRef = adminDb
      .collection(getSavedTrendsCollectionPath(userId))
      .doc(`${username}_${Date.now()}`)

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

    await trendRef.set({
      ...trendData,
      createdAt: FieldValue.serverTimestamp(),
      lastScrapedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({
      success: true,
      trend: {
        id: trendRef.id,
        ...trendData,
      },
    })
  } catch (error: any) {
    const requestedUsername = username || 'unknown'
    const errorMessage = error?.message || 'Failed to scrape TikTok account'
    
    console.error('Scrape API error:', {
      username: requestedUsername,
      error: errorMessage,
      stack: process.env.DEBUG_SCRAPER === 'true' ? error?.stack : undefined,
    })
    
    // Provide more specific error messages with actionable advice
    if (errorMessage.includes('Profile not found') || errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: `TikTok account "@${requestedUsername}" not found or is private`,
          suggestion: 'Verify the username is correct and the account exists'
        },
        { status: 404 }
      )
    }
    
    if (errorMessage.includes('private')) {
      return NextResponse.json(
        { 
          error: `TikTok account "@${requestedUsername}" is private`,
          suggestion: 'Private accounts cannot be scraped'
        },
        { status: 403 }
      )
    }
    
    if (errorMessage.includes('Proxy') || errorMessage.includes('proxy')) {
      return NextResponse.json(
        { 
          error: errorMessage,
          suggestion: 'Try removing the proxy or using a different one. Set DEBUG_SCRAPER=true in .env.local for detailed logs.'
        },
        { status: 502 }
      )
    }
    
    if (errorMessage.includes('Network error') || errorMessage.includes('Unable to reach')) {
      return NextResponse.json(
        { 
          error: errorMessage,
          suggestion: 'Check your internet connection, try using a proxy, or enable DEBUG_SCRAPER=true for detailed debugging'
        },
        { status: 503 }
      )
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return NextResponse.json(
        { 
          error: 'Request timed out. TikTok may be blocking the request.',
          suggestion: 'Try using a proxy, wait a few minutes, or enable DEBUG_SCRAPER=true for detailed logs'
        },
        { status: 504 }
      )
    }
    
    if (errorMessage.includes('CAPTCHA') || errorMessage.includes('blocking')) {
      return NextResponse.json(
        { 
          error: 'TikTok is blocking automated access',
          suggestion: 'Try using a residential proxy, wait before retrying, or enable DEBUG_SCRAPER=true to see what\'s happening'
        },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        suggestion: 'Enable DEBUG_SCRAPER=true in .env.local and check server logs for detailed error information',
        details: process.env.NODE_ENV === 'development' || process.env.DEBUG_SCRAPER === 'true' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

