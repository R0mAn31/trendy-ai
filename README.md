<!-- @format -->

# Trendy AI - TikTok Trends AI Analyzer

MVP веб-додаток для аналізу TikTok акаунтів з AI-рекомендаціями та підтримкою підписок через Paddle.

## Технології

- **Next.js 14** (App Router) + TypeScript
- **Firebase** (Auth + Firestore + Cloud Functions)
- **Paddle** для підписок ($10-15/місяць)
- **Puppeteer** + проксі для scraping TikTok
- **Gemini 3** для AI-аналітики
- **TailwindCSS** + DaisyUI для UI

## Налаштування

1. Встановіть залежності:

```bash
npm install
```

2. Створіть файл `.env.local` з наступними змінними:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_client_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key

GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
# Default: gemini-2.5-flash (latest and fastest)
# Available models: gemini-pro, gemini-1.5-flash, gemini-1.5-pro, gemini-2.5-flash
# Check available models: node scripts/check-gemini-models.js
# See GEMINI_MODELS.md for details and pricing

PADDLE_API_KEY=your_paddle_api_key
PADDLE_SANDBOX_API_KEY=your_paddle_sandbox_key
PADDLE_PRODUCT_ID=your_product_id
PADDLE_WEBHOOK_SECRET=your_webhook_secret

PROXY_LIST=proxy1:port,proxy2:port

# Debug mode for scraping (shows detailed logs and browser window)
DEBUG_SCRAPER=true

# To get free proxies, use:
# node scripts/fetch-proxies.js
# Then add working proxies to PROXY_LIST above
```

3. Запустіть проект:

```bash
npm run dev
```

## Структура проекту

- `/app` - Next.js App Router сторінки та API routes
- `/components` - React компоненти
- `/lib` - Утиліти та конфігурації (Firebase, Gemini, Paddle)
- `/hooks` - Custom React hooks
- `/types` - TypeScript типи
- `/middleware.ts` - Middleware для захисту маршрутів

## Testing Subscriptions

For testing purposes, you can manually set subscription status without going through Paddle:

1. **Via Test Page** (Development only):

   - Navigate to `/test-subscription` while signed in
   - Click "Set Active" to give yourself an active subscription
   - Use other buttons to test different subscription states

2. **Via API** (Development only):

   ```bash
   curl -X POST http://localhost:3000/api/test/subscription \
     -H "Content-Type: application/json" \
     -d '{"userId": "your-user-id", "status": "active"}'
   ```

3. **Check Status**:
   ```bash
   curl http://localhost:3000/api/test/subscription?userId=your-user-id
   ```

⚠️ **Note**: Test endpoints are automatically disabled in production.

## Troubleshooting

Якщо виникають проблеми зі скрапінгом або іншими функціями, дивіться [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Часті проблеми:

**500 помилка при скрапінгу:**

- TikTok може блокувати запити - використовуйте проксі
- Акаунт може бути приватним
- Структура TikTok могла змінитися

**Підписка не працює:**

- Використовуйте `/test-subscription` для тестування
- Перевірте Firestore rules

## TODO

- [ ] Налаштувати Firebase проект та Cloud Functions
- [ ] Додати пул проксі для Puppeteer
- [ ] Налаштувати Paddle продукт та webhook
- [ ] Оптимізувати Puppeteer для production (використовувати puppeteer-core + Chrome)
- [ ] Додати rate limiting для API routes
- [ ] Додати error tracking (Sentry)
- [ ] Додати analytics
- [ ] Додати retry logic для скрапінгу
- [ ] Імплементувати кешування результатів скрапінгу
