import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { getSubscriptionDocPath } from '@/lib/firebase/collections'
import { doc, setDoc, serverTimestamp } from 'firebase-admin/firestore'
import { verifyWebhookSignature } from '@/lib/paddle/client'
import type { PaddleWebhookEvent } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('paddle-signature') || ''
    const timestamp = request.headers.get('paddle-timestamp') || ''
    const body = await request.text()

    // Verify webhook signature (TODO: Implement proper verification)
    // const isValid = verifyWebhookSignature(signature, body, timestamp)
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    const event: PaddleWebhookEvent = JSON.parse(body)

    // Handle different event types
    if (event.event_type === 'subscription.created' || event.event_type === 'subscription.updated') {
      const subscriptionData = event.data
      const userId = subscriptionData.custom_data?.user_id || subscriptionData.customer_id

      if (!userId) {
        return NextResponse.json({ error: 'User ID not found' }, { status: 400 })
      }

      // Update subscription in Firestore
      const subscriptionRef = doc(adminDb, getSubscriptionDocPath(userId))
      await setDoc(
        subscriptionRef,
        {
          userId,
          status: subscriptionData.status === 'active' ? 'active' : 'cancelled',
          paddleSubscriptionId: subscriptionData.id,
          paddleCustomerId: subscriptionData.customer_id,
          currentPeriodStart: subscriptionData.current_billing_period?.start
            ? new Date(subscriptionData.current_billing_period.start)
            : null,
          currentPeriodEnd: subscriptionData.current_billing_period?.end
            ? new Date(subscriptionData.current_billing_period.end)
            : null,
          cancelAtPeriodEnd: !!subscriptionData.cancel_at,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    } else if (event.event_type === 'subscription.cancelled') {
      const subscriptionData = event.data
      const userId = subscriptionData.custom_data?.user_id || subscriptionData.customer_id

      if (userId) {
        const subscriptionRef = doc(adminDb, getSubscriptionDocPath(userId))
        await setDoc(
          subscriptionRef,
          {
            status: 'cancelled',
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Paddle webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

