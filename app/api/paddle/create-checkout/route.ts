import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/paddle/client'
import type { PaddleCheckoutRequest } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body: PaddleCheckoutRequest = await request.json()

    if (!body.userId || !body.email) {
      return NextResponse.json(
        { error: 'userId and email are required' },
        { status: 400 }
      )
    }

    const checkout = await createCheckoutSession(body)

    return NextResponse.json({
      checkout_url: checkout.data?.checkout?.url || checkout.url,
      checkout_id: checkout.data?.id || checkout.id,
    })
  } catch (error) {
    console.error('Paddle checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

