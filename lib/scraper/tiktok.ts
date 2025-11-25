import puppeteer from 'puppeteer'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import puppeteerExtra from 'puppeteer-extra'
import type { TikTokTrend } from '@/types'

// Use stealth plugin to avoid detection
puppeteerExtra.use(StealthPlugin())

// Debug mode - set DEBUG_SCRAPER=true in .env.local
const DEBUG_MODE = process.env.DEBUG_SCRAPER === 'true'

// Proxy pool - Load from environment variable
// Format: PROXY_LIST=proxy1:port,proxy2:port,proxy3:port
// Or use scripts/fetch-proxies.js to get free proxies
const PROXY_POOL = process.env.PROXY_LIST?.split(',').map(p => p.trim()).filter(p => p) || []

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`[SCRAPER DEBUG] ${message}`, data || '')
  }
}

function getRandomProxy(): string | undefined {
  if (PROXY_POOL.length === 0) {
    debugLog('No proxies configured. Scraping without proxy (may be blocked by TikTok)')
    return undefined
  }
  const proxy = PROXY_POOL[Math.floor(Math.random() * PROXY_POOL.length)]
  debugLog(`Using proxy: ${proxy}`)
  return proxy
}

export async function scrapeTikTokAccount(username: string): Promise<Omit<TikTokTrend, 'id' | 'userId' | 'createdAt'>> {
  const proxy = getRandomProxy()
  let browser: any = null
  let page: any = null
  
  debugLog(`Starting scrape for @${username}`, { proxy: proxy || 'none' })
  
  try {
    const launchOptions: any = {
      headless: DEBUG_MODE ? false : true, // Show browser in debug mode
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--window-size=1920,1080',
      ],
    }

    if (proxy) {
      launchOptions.args.push(`--proxy-server=${proxy}`)
      debugLog(`Launching browser with proxy: ${proxy}`)
    } else {
      debugLog('Launching browser without proxy')
    }

    browser = await puppeteerExtra.launch(launchOptions)
    debugLog('Browser launched successfully')

    page = await browser.newPage()
    debugLog('New page created')

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 })
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    await page.setUserAgent(userAgent)
    debugLog('Viewport and user agent set', { userAgent })

    // Remove webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      })
    })
    debugLog('Webdriver property hidden')

    // Enable request/response logging in debug mode
    if (DEBUG_MODE) {
      page.on('request', (request: any) => {
        debugLog(`Request: ${request.method()} ${request.url()}`)
      })
      page.on('response', (response: any) => {
        debugLog(`Response: ${response.status()} ${response.url()}`)
      })
      page.on('requestfailed', (request: any) => {
        debugLog(`Request failed: ${request.url()} - ${request.failure()?.errorText}`)
      })
    }

    // Navigate to TikTok profile
    const profileUrl = `https://www.tiktok.com/@${username}`
    debugLog(`Navigating to: ${profileUrl}`)
    
    let timeoutId: NodeJS.Timeout | null = null
    try {
      const navigationPromise = page.goto(profileUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      })

      // Add timeout handler
      timeoutId = setTimeout(() => {
        debugLog('Navigation timeout - page may be slow or blocked')
      }, 25000)

      await navigationPromise
      if (timeoutId) clearTimeout(timeoutId)
      debugLog('Navigation completed')
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId)
      debugLog('Navigation error', { error: error.message, code: error.code })
      
      if (error.message.includes('net::ERR')) {
        const errorCode = error.message.match(/net::ERR_(\w+)/)?.[1]
        debugLog(`Network error code: ${errorCode}`)
        
        if (errorCode === 'PROXY_CONNECTION_FAILED' || errorCode === 'TUNNEL_CONNECTION_FAILED') {
          throw new Error(`Proxy connection failed: ${proxy}. Try a different proxy or disable proxy.`)
        }
        
        if (errorCode === 'TIMED_OUT' || errorCode === 'CONNECTION_TIMED_OUT') {
          throw new Error(`Connection timed out. TikTok may be blocking requests. ${proxy ? 'Try a different proxy.' : 'Consider using a proxy.'}`)
        }
        
        if (errorCode === 'CONNECTION_REFUSED') {
          throw new Error(`Connection refused. ${proxy ? 'Proxy may be down or blocked.' : 'Check your internet connection.'}`)
        }
        
        throw new Error(`Network error (${errorCode}): Unable to reach TikTok. ${proxy ? `Proxy ${proxy} may be blocked or invalid.` : 'Check your internet connection or try using a proxy.'}`)
      }
      
      if (error.message.includes('Navigation timeout')) {
        throw new Error(`Navigation timeout: TikTok took too long to respond. ${proxy ? 'Proxy may be slow.' : 'Try using a proxy or check your connection.'}`)
      }
      
      throw error
    }

    // Wait a bit for content to load
    debugLog('Waiting for content to load...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if page loaded correctly
    const pageTitle = await page.title()
    debugLog('Page title', { title: pageTitle })
    
    if (pageTitle.includes('404') || pageTitle.includes('Not Found')) {
      throw new Error(`Profile not found: @${username} does not exist`)
    }

    // Check for common TikTok error pages
    const pageContent = await page.content()
    debugLog('Page content length', { length: pageContent.length })
    
    if (pageContent.includes('This page isn\'t available') || pageContent.includes('User not found')) {
      throw new Error(`Profile not found: @${username} does not exist`)
    }
    
    if (pageContent.includes('private') && pageContent.includes('This account is private')) {
      throw new Error(`Profile is private: @${username}`)
    }
    
    if (pageContent.includes('blocked') || pageContent.includes('unavailable')) {
      throw new Error(`Profile is blocked or unavailable: @${username}`)
    }

    // Check for CAPTCHA or blocking
    if (pageContent.includes('captcha') || pageContent.includes('verify') || pageContent.includes('robot')) {
      debugLog('WARNING: Possible CAPTCHA or bot detection')
      throw new Error(`TikTok may be blocking automated access. Try using a different proxy or wait before retrying.`)
    }

    // Try multiple selectors for profile data
    let profileLoaded = false
    const selectors = [
      '[data-e2e="user-title"]',
      '[data-e2e="user-name"]',
      'h1[data-e2e="user-title"]',
      '.tiktok-username',
      'h1',
    ]

    debugLog('Checking for profile selectors...')
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        debugLog(`Found profile using selector: ${selector}`)
        profileLoaded = true
        break
      } catch {
        debugLog(`Selector not found: ${selector}`)
        continue
      }
    }

    if (!profileLoaded) {
      // Take screenshot in debug mode
      if (DEBUG_MODE) {
        try {
          await page.screenshot({ path: `debug-${username}-${Date.now()}.png`, fullPage: true })
          debugLog('Screenshot saved for debugging')
        } catch (e) {
          debugLog('Could not save screenshot', { error: e })
        }
      }
      
      // Check if it's a private account or blocked
      if (pageContent.includes('private') || pageContent.includes('This account is private')) {
        throw new Error(`Profile is private: @${username}`)
      }
      if (pageContent.includes('blocked') || pageContent.includes('unavailable')) {
        throw new Error(`Profile is blocked or unavailable: @${username}`)
      }
      
      debugLog('Profile selectors not found. Page content preview:', {
        title: pageTitle,
        url: page.url(),
        contentLength: pageContent.length,
        first500Chars: pageContent.substring(0, 500)
      })
      
      throw new Error(`Profile not found or failed to load: @${username}. TikTok may have changed their structure or the page may be blocked.`)
    }

    // Extract profile data with fallback selectors
    debugLog('Extracting profile data...')
    const accountData = await page.evaluate(() => {
      const getTextContent = (selectors: string[]): string => {
        for (const selector of selectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            return element.textContent.trim()
          }
        }
        return '0'
      }

      const parseNumber = (text: string): number => {
        if (!text || text === '0') return 0
        const cleaned = text.replace(/[^\d.KMB]/g, '').toUpperCase()
        if (cleaned.includes('K')) {
          return parseFloat(cleaned.replace('K', '')) * 1000
        }
        if (cleaned.includes('M')) {
          return parseFloat(cleaned.replace('M', '')) * 1000000
        }
        if (cleaned.includes('B')) {
          return parseFloat(cleaned.replace('B', '')) * 1000000000
        }
        return parseFloat(cleaned) || 0
      }

      // Try multiple selectors for each field
      const followersText = getTextContent([
        '[data-e2e="followers-count"]',
        '[data-e2e="follower-count"]',
        '.followers-count',
        'strong[title*="Followers"]',
      ]) || '0'
      
      const likesText = getTextContent([
        '[data-e2e="likes-count"]',
        '[data-e2e="like-count"]',
        '.likes-count',
        'strong[title*="Likes"]',
      ]) || '0'
      
      const displayName = getTextContent([
        '[data-e2e="user-title"]',
        '[data-e2e="user-name"]',
        'h1[data-e2e="user-title"]',
        '.tiktok-username',
        'h1',
      ]) || ''

      // Extract video count (try multiple methods)
      let videoCount = 0
      const videoSelectors = [
        '[data-e2e="user-post-item"]',
        '[data-e2e="user-post-item-list"] > div',
        '.video-item',
      ]
      
      for (const selector of videoSelectors) {
        const elements = document.querySelectorAll(selector)
        if (elements.length > 0) {
          videoCount = elements.length
          break
        }
      }

      // Extract hashtags from video descriptions
      const hashtags = new Set<string>()
      const descSelectors = [
        '[data-e2e="user-post-item-desc"]',
        '.video-description',
        '[data-e2e="user-post-item"] [class*="desc"]',
      ]
      
      descSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          const text = el.textContent || ''
          const matches = text.match(/#[\w\u0590-\u05ff]+/g)
          if (matches) {
            matches.forEach((tag) => hashtags.add(tag))
          }
        })
      })

      // Extract audio tracks
      const audioTracks = new Set<string>()
      const audioSelectors = [
        '[data-e2e="video-music"]',
        '.video-music',
        '[class*="music"]',
      ]
      
      audioSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          const audioName = el.textContent?.trim()
          if (audioName && audioName.length > 0) {
            audioTracks.add(audioName)
          }
        })
      })

      // Calculate total views
      let totalViews = 0
      const viewSelectors = [
        '[data-e2e="video-view-count"]',
        '.video-view-count',
        '[class*="view"]',
      ]
      
      viewSelectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          const viewsText = el.textContent || '0'
          totalViews += parseNumber(viewsText)
        })
      })

      return {
        displayName,
        followers: parseNumber(followersText),
        likes: parseNumber(likesText),
        views: totalViews,
        videoCount,
        hashtags: Array.from(hashtags).slice(0, 20),
        audioTracks: Array.from(audioTracks).slice(0, 20),
      }
    })

    debugLog('Data extracted successfully', accountData)

    if (browser) {
      await browser.close()
      debugLog('Browser closed')
    }

    // Validate scraped data
    if (!accountData.displayName && accountData.followers === 0 && accountData.likes === 0) {
      throw new Error(`Unable to extract data from @${username}. The account may be private or TikTok structure has changed.`)
    }

    return {
      accountUsername: username,
      accountDisplayName: accountData.displayName || username,
      followers: accountData.followers,
      likes: accountData.likes,
      views: accountData.views,
      videoCount: accountData.videoCount,
      hashtags: accountData.hashtags,
      audioTracks: accountData.audioTracks,
      lastScrapedAt: new Date(),
    }
  } catch (error: any) {
    if (browser) {
      try {
        await browser.close()
        debugLog('Browser closed after error')
      } catch (closeError) {
        debugLog('Error closing browser', { error: closeError })
      }
    }
    
    debugLog('Scraping error', { 
      username, 
      error: error.message, 
      stack: error.stack,
      proxy: proxy || 'none'
    })
    
    // Re-throw with original error message if it's already descriptive
    if (error.message && (error.message.includes('@') || error.message.includes('Proxy') || error.message.includes('Network'))) {
      throw error
    }
    
    throw new Error(`Failed to scrape TikTok account @${username}: ${error?.message || 'Unknown error'}`)
  }
}
