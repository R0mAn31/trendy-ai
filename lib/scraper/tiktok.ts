import puppeteer from 'puppeteer'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import puppeteerExtra from 'puppeteer-extra'
import type { TikTokTrend } from '@/types'

// Use stealth plugin to avoid detection
puppeteerExtra.use(StealthPlugin())

// Proxy pool (TODO: Load from environment variable or database)
const PROXY_POOL = process.env.PROXY_LIST?.split(',') || []

function getRandomProxy(): string | undefined {
  if (PROXY_POOL.length === 0) return undefined
  return PROXY_POOL[Math.floor(Math.random() * PROXY_POOL.length)]
}

export async function scrapeTikTokAccount(username: string): Promise<Omit<TikTokTrend, 'id' | 'userId' | 'createdAt'>> {
  const proxy = getRandomProxy()
  const browser = await puppeteerExtra.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      ...(proxy ? [`--proxy-server=${proxy}`] : []),
    ],
  })

  try {
    const page = await browser.newPage()
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    // Navigate to TikTok profile
    const profileUrl = `https://www.tiktok.com/@${username}`
    await page.goto(profileUrl, { waitUntil: 'networkidle2', timeout: 30000 })

    // Wait for profile data to load
    await page.waitForSelector('[data-e2e="user-title"]', { timeout: 10000 }).catch(() => {
      throw new Error('Profile not found or failed to load')
    })

    // Extract profile data
    const accountData = await page.evaluate(() => {
      const getTextContent = (selector: string): string => {
        const element = document.querySelector(selector)
        return element?.textContent?.trim() || '0'
      }

      const parseNumber = (text: string): number => {
        const cleaned = text.replace(/[^\d.]/g, '')
        if (cleaned.includes('K')) {
          return parseFloat(cleaned) * 1000
        }
        if (cleaned.includes('M')) {
          return parseFloat(cleaned) * 1000000
        }
        return parseFloat(cleaned) || 0
      }

      // Extract stats
      const followersText = getTextContent('[data-e2e="followers-count"]') || '0'
      const likesText = getTextContent('[data-e2e="likes-count"]') || '0'
      const displayName = getTextContent('[data-e2e="user-title"]') || ''

      // Extract video count (approximate from video list)
      const videoElements = document.querySelectorAll('[data-e2e="user-post-item"]')
      const videoCount = videoElements.length

      // Extract hashtags from video descriptions (sample)
      const hashtags = new Set<string>()
      document.querySelectorAll('[data-e2e="user-post-item-desc"]').forEach((el) => {
        const text = el.textContent || ''
        const matches = text.match(/#\w+/g)
        if (matches) {
          matches.forEach((tag) => hashtags.add(tag))
        }
      })

      // Extract audio tracks (sample)
      const audioTracks = new Set<string>()
      document.querySelectorAll('[data-e2e="user-post-item"]').forEach((el) => {
        const audioEl = el.querySelector('[data-e2e="video-music"]')
        if (audioEl) {
          const audioName = audioEl.textContent?.trim()
          if (audioName) audioTracks.add(audioName)
        }
      })

      // Calculate total views (approximate from visible videos)
      let totalViews = 0
      document.querySelectorAll('[data-e2e="video-view-count"]').forEach((el) => {
        const viewsText = el.textContent || '0'
        totalViews += parseNumber(viewsText)
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

    await browser.close()

    return {
      accountUsername: username,
      accountDisplayName: accountData.displayName,
      followers: accountData.followers,
      likes: accountData.likes,
      views: accountData.views,
      videoCount: accountData.videoCount,
      hashtags: accountData.hashtags,
      audioTracks: accountData.audioTracks,
      lastScrapedAt: new Date(),
    }
  } catch (error) {
    await browser.close()
    console.error('Scraping error:', error)
    throw new Error(`Failed to scrape TikTok account: ${username}`)
  }
}

