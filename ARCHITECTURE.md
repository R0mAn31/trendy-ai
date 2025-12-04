# Architecture Overview - Trendy AI

## Project Structure

```
trendy-ai/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   │   ├── scrape/        # TikTok scraping endpoint
│   │   ├── analyze/       # Gemini AI analysis endpoint
│   │   └── paddle/        # Paddle subscription endpoints
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard page
│   ├── profile/           # User profile page
│   ├── paywall/           # Subscription paywall page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Layout components (Sidebar, Topbar)
│   ├── dashboard/         # Dashboard-specific components
│   └── paywall/           # Paywall component
├── hooks/                 # Custom React hooks
│   ├── useUser.ts         # User data hook
│   └── useSubscription.ts # Subscription status hook
├── lib/                   # Utility libraries
│   ├── firebase/          # Firebase configuration & helpers
│   ├── gemini/            # Gemini AI client
│   ├── paddle/            # Paddle integration
│   ├── scraper/           # TikTok scraper (Puppeteer)
│   └── utils/             # General utilities
├── types/                 # TypeScript type definitions
└── middleware.ts          # Next.js middleware for route protection
```

## Data Flow

### Authentication Flow
1. User signs in via Firebase Auth (Email/Password or Google)
2. `useUser` hook fetches user document from Firestore
3. User document created/updated automatically

### Subscription Flow
1. User clicks "Subscribe" → calls `/api/paddle/create-checkout`
2. Paddle checkout session created → redirects to Paddle
3. After payment → Paddle webhook → `/api/paddle/webhook`
4. Webhook updates Firestore subscription document
5. `useSubscription` hook detects active subscription

### Scraping Flow
1. User enters TikTok username → clicks "Scrape Account"
2. Frontend calls `/api/scrape` with username
3. API uses Puppeteer to scrape TikTok profile
4. Scraped data saved to Firestore `saved_trends/{userId}/items/{itemId}`
5. Frontend refreshes trends list

### AI Analysis Flow
1. User clicks "Analyze with AI" on a trend
2. Frontend calls `/api/analyze` with trendId
3. API fetches trend data from Firestore
4. API calls Gemini 3 with account data
5. AI recommendations saved to Firestore `analysis/{userId}/items/{itemId}`
6. Frontend displays results in modal

## Firestore Schema

### Collections

```
users/{userId}
  - email: string
  - displayName: string
  - photoURL: string
  - createdAt: timestamp
  - updatedAt: timestamp

subscriptions/{userId}
  - status: 'active' | 'cancelled' | 'past_due' | 'paused'
  - paddleSubscriptionId: string
  - paddleCustomerId: string
  - currentPeriodStart: timestamp
  - currentPeriodEnd: timestamp
  - cancelAtPeriodEnd: boolean
  - createdAt: timestamp
  - updatedAt: timestamp

saved_trends/{userId}/items/{itemId}
  - accountUsername: string
  - accountDisplayName: string
  - followers: number
  - likes: number
  - views: number
  - videoCount: number
  - hashtags: string[]
  - audioTracks: string[]
  - lastScrapedAt: timestamp
  - createdAt: timestamp

analysis/{userId}/items/{itemId}
  - trendId: string
  - recommendations: {
      hashtags: string[]
      audioSuggestions: string[]
      videoScripts: string[]
      postingTimes: string[]
      contentFormats: string[]
      engagementTips: string[]
    }
  - generatedAt: timestamp
```

## Security Considerations

1. **Firestore Rules**: Users can only access their own data
2. **API Routes**: Server-side validation of user authentication
3. **Middleware**: Route protection (basic implementation)
4. **Paddle Webhooks**: Signature verification (TODO for production)

## Performance Optimizations

1. **Caching**: Consider caching scraped data to avoid repeated requests
2. **Rate Limiting**: Add rate limits to API routes
3. **Puppeteer**: Use connection pooling and proxy rotation
4. **Firestore**: Use indexes for queries

## Scalability

1. **Puppeteer**: Consider using headless browser service (Browserless.io) for production
2. **Proxies**: Rotate proxies to avoid rate limits
3. **Queue System**: Use job queue (Bull/BullMQ) for scraping tasks
4. **CDN**: Serve static assets via CDN

## Monitoring & Logging

- Add error tracking (Sentry)
- Add logging (Winston/Pino)
- Monitor API usage and costs
- Track subscription metrics



