import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { getSubscriptionDocPath } from '@/lib/firebase/collections'
import { FieldValue } from 'firebase-admin/firestore'

/**
 * TEST ONLY - Manually create/update subscription for testing
 * 
 * Usage:
 * POST /api/test/subscription
 * Body: { userId: "your-user-id", status: "active" }
 * 
 * Status options: "active" | "cancelled" | "past_due" | "paused"
 * 
 * ⚠️ WARNING: This endpoint should be disabled in production!
 * Add environment check or remove this file before deploying.
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    )
  }

  try {
    const { userId, status = 'active' } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['active', 'cancelled', 'past_due', 'paused']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()
    const subscriptionRef = adminDb.doc(getSubscriptionDocPath(userId))

    // Calculate period dates (30 days from now)
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setDate(periodEnd.getDate() + 30)

    await subscriptionRef.set(
      {
        userId,
        status,
        paddleSubscriptionId: `test_sub_${Date.now()}`,
        paddleCustomerId: `test_customer_${userId}`,
        currentPeriodStart: FieldValue.serverTimestamp(),
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: status === 'cancelled' ? true : false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    return NextResponse.json({
      success: true,
      message: `Subscription set to "${status}" for user ${userId}`,
      subscription: {
        userId,
        status,
        currentPeriodEnd: periodEnd.toISOString(),
      },
    })
  } catch (error) {
    console.error('Test subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

/**
 * GET - Check current subscription status
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    const adminDb = getAdminDb()
    const subscriptionRef = adminDb.doc(getSubscriptionDocPath(userId))
    const subscriptionDoc = await subscriptionRef.get()

    if (!subscriptionDoc.exists) {
      return NextResponse.json({
        exists: false,
        message: 'No subscription found',
      })
    }

    const data = subscriptionDoc.data()
    return NextResponse.json({
      exists: true,
      subscription: {
        userId,
        status: data?.status,
        currentPeriodEnd: data?.currentPeriodEnd?.toDate?.()?.toISOString(),
        cancelAtPeriodEnd: data?.cancelAtPeriodEnd,
      },
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}



