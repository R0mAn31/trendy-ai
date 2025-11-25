<!-- @format -->

# Setup Guide - Trendy AI

## Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project
- Google Cloud account (for Gemini API)
- Paddle account
- TikTok account for testing

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google provider
3. Create Firestore database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see `firestore.rules` below)
4. Get Firebase Admin credentials:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Save the JSON file

## Step 3: Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Firebase (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (from Service Account JSON)
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Gemini API (from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=...

# Paddle (from https://vendors.paddle.com/)
PADDLE_API_KEY=...
PADDLE_SANDBOX_API_KEY=...
PADDLE_PRODUCT_ID=...
PADDLE_WEBHOOK_SECRET=...

# Proxies (optional, comma-separated)
PROXY_LIST=proxy1:port,proxy2:port
```

## Step 4: Gemini API Setup

1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add it to `.env.local`

## Step 5: Paddle Setup

1. Create account at https://vendors.paddle.com/
2. Create a product with recurring subscription ($10-15/month)
3. Get your API keys (sandbox for testing)
4. Set up webhook endpoint: `https://yourdomain.com/api/paddle/webhook`
5. Add webhook secret to `.env.local`

## Step 6: Firestore Security Rules

Create `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Subscriptions
    match /subscriptions/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only server can write
    }

    // Saved trends
    match /saved_trends/{userId}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Analysis
    match /analysis/{userId}/items/{itemId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

## Step 7: Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Step 8: Production Deployment (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy

## Important Notes

### Puppeteer in Production

For production, you'll need to:

- Use `puppeteer-core` instead of `puppeteer`
- Install Chrome separately (e.g., via Docker or Vercel's Chrome extension)
- Or use a headless browser service like Browserless.io

### Proxy Setup

For TikTok scraping, you'll need reliable proxies:

- Consider services like Bright Data, Oxylabs, or Smartproxy
- Add proxies to `PROXY_LIST` environment variable
- Rotate proxies to avoid rate limits

### Rate Limiting

Add rate limiting to API routes:

- Use libraries like `@upstash/ratelimit`
- Limit scraping requests per user
- Cache results when possible

### Error Handling

- Add error tracking (Sentry)
- Add logging (Winston/Pino)
- Monitor API usage

## TODO for Production

- [ ] Implement proper Firebase token verification in middleware
- [ ] Add rate limiting to API routes
- [ ] Set up error tracking (Sentry)
- [ ] Add analytics (Google Analytics/Mixpanel)
- [ ] Optimize Puppeteer for production
- [ ] Add caching for scraped data
- [ ] Implement proper Paddle webhook signature verification
- [ ] Add unit and integration tests
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring and alerts
