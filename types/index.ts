// User types
export interface User {
  id: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: Date
  updatedAt: Date
}

// Subscription types
export interface Subscription {
  userId: string
  status: 'active' | 'cancelled' | 'past_due' | 'paused'
  paddleSubscriptionId?: string
  paddleCustomerId?: string
  currentPeriodEnd?: Date
  currentPeriodStart?: Date
  cancelAtPeriodEnd?: boolean
  createdAt: Date
  updatedAt: Date
}

// TikTok Trend types
export interface TikTokTrend {
  id: string
  userId: string
  accountUsername: string
  accountDisplayName?: string
  followers: number
  likes: number
  views: number
  videoCount: number
  hashtags: string[]
  audioTracks: string[]
  lastScrapedAt: Date
  createdAt: Date
}

// AI Analysis types
export interface AIAnalysis {
  id: string
  userId: string
  trendId: string
  recommendations: {
    hashtags: string[]
    audioSuggestions: string[]
    videoScripts: string[]
    postingTimes: string[]
    contentFormats: string[]
    engagementTips: string[]
  }
  generatedAt: Date
}

// Video Ideas
export interface VideoIdea {
  title: string
  script: string
  hashtags: string[]
  audioSuggestion: string
  postingTime: string
  format: string
}

// Paddle types
export interface PaddleCheckoutRequest {
  userId: string
  email: string
}

export interface PaddleWebhookEvent {
  event_id: string
  event_type: string
  occurred_at: string
  data: {
    id: string
    status: string
    customer_id: string
    items: Array<{
      price_id: string
      quantity: number
    }>
    current_billing_period?: {
      start: string
      end: string
    }
    cancel_at?: string
    custom_data?: {
      user_id?: string
      [key: string]: any
    }
  }
}

