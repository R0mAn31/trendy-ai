import axios from 'axios'
import type { PaddleCheckoutRequest } from '@/types'

const PADDLE_API_URL = process.env.PADDLE_API_KEY?.startsWith('test_')
  ? 'https://sandbox-api.paddle.com'
  : 'https://api.paddle.com'

const PADDLE_API_KEY = process.env.PADDLE_API_KEY || process.env.PADDLE_SANDBOX_API_KEY || ''

export async function createCheckoutSession(request: PaddleCheckoutRequest) {
  try {
    const response = await axios.post(
      `${PADDLE_API_URL}/transactions`,
      {
        items: [
          {
            price_id: process.env.PADDLE_PRODUCT_ID,
            quantity: 1,
          },
        ],
        customer_id: request.userId,
        customer_email: request.email,
        custom_data: {
          user_id: request.userId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PADDLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.data
  } catch (error) {
    console.error('Paddle checkout error:', error)
    throw new Error('Failed to create checkout session')
  }
}

export function verifyWebhookSignature(
  signature: string,
  body: string,
  timestamp: string
): boolean {
  // TODO: Implement Paddle webhook signature verification
  // See: https://developer.paddle.com/webhooks/verify-webhooks
  // For MVP, we'll skip this but it should be implemented in production
  return true
}

