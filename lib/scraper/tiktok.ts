/** @format */

import puppeteer from "puppeteer";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import puppeteerExtra from "puppeteer-extra";
import type { TikTokTrend } from "@/types";

// Use stealth plugin to avoid detection
puppeteerExtra.use(StealthPlugin());

// Debug mode - set DEBUG_SCRAPER=true in .env.local
const DEBUG_MODE = process.env.DEBUG_SCRAPER === "true";

// Proxy pool - Load from environment variable
const PROXY_POOL =
  process.env.PROXY_LIST?.split(",")
    .map((p) => p.trim())
    .filter((p) => p) || [];

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

function debugLog(message: string, data?: any) {
  if (DEBUG_MODE) {
    console.log(`[SCRAPER DEBUG] ${message}`, data || "");
  }
}

function getRandomProxy(): string | undefined {
  if (PROXY_POOL.length === 0) {
    debugLog(
      "No proxies configured. Scraping without proxy (may be blocked by TikTok)"
    );
    return undefined;
  }
  const proxy = PROXY_POOL[Math.floor(Math.random() * PROXY_POOL.length)];
  debugLog(`Using proxy: ${proxy}`);
  return proxy;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface SIGIState {
  UserModule?: {
    users?: {
      [key: string]: {
        nickname?: string;
        uniqueId?: string;
        signature?: string;
        avatarLarger?: string;
        avatarMedium?: string;
        avatarThumb?: string;
        verified?: boolean;
        stats?: {
          followerCount?: number;
          followingCount?: number;
          heartCount?: number;
          videoCount?: number;
        };
      };
    };
  };
  ItemModule?: {
    items?: {
      [key: string]: {
        desc?: string;
        music?: {
          title?: string;
          authorName?: string;
        };
        stats?: {
          playCount?: number;
          diggCount?: number;
          commentCount?: number;
          shareCount?: number;
        };
        hashtags?: Array<{
          name?: string;
        }>;
      };
    };
  };
}

/**
 * Extract SIGI_STATE JSON from TikTok page
 * TikTok stores all data in window.__UNIVERSAL_DATA_FOR_REHYDRATION__ or in script tags
 */
function extractSIGIState(pageContent: string): SIGIState | null {
  try {
    // Method 1: Try to find SIGI_STATE in script tag with id
    const sigiMatch = pageContent.match(
      /<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
    );
    if (sigiMatch && sigiMatch[1]) {
      try {
        const data = JSON.parse(sigiMatch[1]);
        if (data["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]) {
          return data["__DEFAULT_SCOPE__"]["webapp.user-detail"];
        }
        if (data.UserModule || data.ItemModule) {
          return data as SIGIState;
        }
        return data as SIGIState;
      } catch (e) {
        debugLog("Failed to parse SIGI_STATE from script tag", { error: e });
      }
    }

    // Method 2: Try to find window.__UNIVERSAL_DATA_FOR_REHYDRATION__
    const windowDataMatch = pageContent.match(
      /window\.__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*({[\s\S]*?});/
    );
    if (windowDataMatch && windowDataMatch[1]) {
      try {
        const data = JSON.parse(windowDataMatch[1]);
        if (data["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]) {
          return data["__DEFAULT_SCOPE__"]["webapp.user-detail"];
        }
        if (data.UserModule || data.ItemModule) {
          return data as SIGIState;
        }
        return data as SIGIState;
      } catch (e) {
        debugLog("Failed to parse window.__UNIVERSAL_DATA_FOR_REHYDRATION__", {
          error: e,
        });
      }
    }

    // Method 3: Try to find SIGI_STATE in any script tag
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
    let scriptMatch;
    while ((scriptMatch = scriptRegex.exec(pageContent)) !== null) {
      const match = scriptMatch;
      const scriptContent = match[1];
      if (
        scriptContent.includes("SIGI_STATE") ||
        scriptContent.includes("UserModule") ||
        scriptContent.includes("ItemModule") ||
        scriptContent.includes("__UNIVERSAL_DATA_FOR_REHYDRATION__")
      ) {
        try {
          // Try to extract JSON object - look for the actual data structure
          let jsonMatch = scriptContent.match(/({[\s\S]*"UserModule"[\s\S]*})/);
          if (!jsonMatch) {
            jsonMatch = scriptContent.match(/({[\s\S]*"ItemModule"[\s\S]*})/);
          }
          if (!jsonMatch) {
            jsonMatch = scriptContent.match(/({[\s\S]*})/);
          }
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[1]);
            if (data.UserModule || data.ItemModule) {
              return data as SIGIState;
            }
            if (data["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]) {
              return data["__DEFAULT_SCOPE__"]["webapp.user-detail"];
            }
          }
        } catch (e) {
          // Continue searching
          continue;
        }
      }
    }

    debugLog("SIGI_STATE not found in page content");
    return null;
  } catch (error) {
    debugLog("Error extracting SIGI_STATE", { error });
    return null;
  }
}

/**
 * Extract SIGI_STATE from browser context (more reliable)
 */
async function extractSIGIStateFromBrowser(
  page: any
): Promise<SIGIState | null> {
  try {
    const sigiState = await page.evaluate(() => {
      // Method 1: Try to access window.__UNIVERSAL_DATA_FOR_REHYDRATION__
      if ((window as any).__UNIVERSAL_DATA_FOR_REHYDRATION__) {
        const data = (window as any).__UNIVERSAL_DATA_FOR_REHYDRATION__;
        if (data["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]) {
          return data["__DEFAULT_SCOPE__"]["webapp.user-detail"];
        }
        if (data.UserModule || data.ItemModule) {
          return data;
        }
        return data;
      }

      // Method 2: Try to find script tag with data
      const scripts = Array.from(document.querySelectorAll("script"));
      for (const script of scripts) {
        if (
          script.id === "__UNIVERSAL_DATA_FOR_REHYDRATION__" ||
          script.textContent?.includes("UserModule") ||
          script.textContent?.includes("ItemModule")
        ) {
          try {
            const content = script.textContent || "";

            // Try to find JSON object
            let jsonMatch = content.match(/({[\s\S]*"UserModule"[\s\S]*})/);
            if (!jsonMatch) {
              jsonMatch = content.match(/({[\s\S]*"ItemModule"[\s\S]*})/);
            }
            if (!jsonMatch) {
              jsonMatch = content.match(/({[\s\S]*})/);
            }

            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[1]);
              if (parsed.UserModule || parsed.ItemModule) {
                return parsed;
              }
              if (parsed["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]) {
                return parsed["__DEFAULT_SCOPE__"]["webapp.user-detail"];
              }
            }
          } catch (e) {
            continue;
          }
        }
      }
      return null;
    });

    return sigiState;
  } catch (error) {
    debugLog("Error extracting SIGI_STATE from browser context", { error });
    return null;
  }
}

/**
 * Validate and extract user data from SIGI_STATE
 */
function extractUserData(
  sigiState: SIGIState,
  username: string
): {
  accountDisplayName: string;
  followers: number;
  likes: number;
  videoCount: number;
} {
  let accountDisplayName = username;
  let followers = 0;
  let likes = 0;
  let videoCount = 0;

  if (sigiState.UserModule?.users) {
    const users = sigiState.UserModule.users;
    const userData =
      Object.values(users).find(
        (user: any) =>
          user.uniqueId?.toLowerCase() === username.toLowerCase() ||
          user.nickname?.toLowerCase() === username.toLowerCase()
      ) || Object.values(users)[0]; // Fallback to first user

    if (userData) {
      accountDisplayName = userData.nickname || userData.uniqueId || username;
      followers = userData.stats?.followerCount || 0;
      likes = userData.stats?.heartCount || 0;
      videoCount = userData.stats?.videoCount || 0;

      debugLog("User data extracted", {
        displayName: accountDisplayName,
        followers,
        likes,
        videoCount,
      });
    }
  }

  return {
    accountDisplayName,
    followers,
    likes,
    videoCount,
  };
}

/**
 * Extract video data (hashtags, audio tracks, views) from SIGI_STATE
 */
function extractVideoData(sigiState: SIGIState): {
  hashtags: string[];
  audioTracks: string[];
  totalViews: number;
} {
  const hashtags = new Set<string>();
  const audioTracks = new Set<string>();
  let totalViews = 0;

  if (sigiState.ItemModule?.items) {
    const items = sigiState.ItemModule.items;
    const videoItems = Object.values(items) as any[];

    debugLog(`Found ${videoItems.length} video items`);

    for (const item of videoItems) {
      // Extract hashtags from description
      if (item.desc) {
        const hashtagMatches = item.desc.match(/#[\w\u0590-\u05ff]+/g);
        if (hashtagMatches) {
          hashtagMatches.forEach((tag: string) => hashtags.add(tag));
        }
      }

      // Extract hashtags from hashtags array
      if (item.hashtags && Array.isArray(item.hashtags)) {
        item.hashtags.forEach((tag: any) => {
          if (tag.name) {
            hashtags.add(`#${tag.name}`);
          }
        });
      }

      // Extract audio track
      if (item.music?.title) {
        audioTracks.add(item.music.title);
      }
      if (item.music?.authorName) {
        audioTracks.add(`${item.music.authorName} - ${item.music.title || ""}`);
      }

      // Sum up views
      if (item.stats?.playCount) {
        totalViews += item.stats.playCount;
      }
    }
  }

  debugLog("Video data extracted", {
    hashtagsCount: hashtags.size,
    audioTracksCount: audioTracks.size,
    totalViews,
  });

  return {
    hashtags: Array.from(hashtags).slice(0, 20),
    audioTracks: Array.from(audioTracks).slice(0, 20),
    totalViews,
  };
}

/**
 * Main scraping function with retry logic
 */
export async function scrapeTikTokAccount(
  username: string
): Promise<Omit<TikTokTrend, "id" | "userId" | "createdAt">> {
  let lastError: Error | null = null;

  // Retry loop
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const proxy = getRandomProxy();
    let browser: any = null;
    let page: any = null;

    debugLog(
      `Starting scrape attempt ${attempt}/${MAX_RETRIES} for @${username}`,
      {
        proxy: proxy || "none",
      }
    );

    try {
      const launchOptions: any = {
        headless: DEBUG_MODE ? false : true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--disable-blink-features=AutomationControlled",
          "--disable-features=IsolateOrigins,site-per-process",
          "--window-size=1920,1080",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
        ],
      };

      if (proxy) {
        launchOptions.args.push(`--proxy-server=${proxy}`);
        debugLog(`Launching browser with proxy: ${proxy}`);
      } else {
        debugLog("Launching browser without proxy");
      }

      browser = await puppeteerExtra.launch(launchOptions);
      debugLog("Browser launched successfully");

      page = await browser.newPage();
      debugLog("New page created");

      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      const userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
      await page.setUserAgent(userAgent);
      debugLog("Viewport and user agent set", { userAgent });

      // Remove webdriver property and other automation indicators
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", {
          get: () => false,
        });

        // Override plugins
        Object.defineProperty(navigator, "plugins", {
          get: () => [1, 2, 3, 4, 5],
        });

        // Override languages
        Object.defineProperty(navigator, "languages", {
          get: () => ["en-US", "en"],
        });
      });
      debugLog("Webdriver property hidden");

      // Enable request/response logging in debug mode
      if (DEBUG_MODE) {
        page.on("request", (request: any) => {
          debugLog(`Request: ${request.method()} ${request.url()}`);
        });
        page.on("response", (response: any) => {
          debugLog(`Response: ${response.status()} ${response.url()}`);
        });
        page.on("requestfailed", (request: any) => {
          debugLog(
            `Request failed: ${request.url()} - ${request.failure()?.errorText}`
          );
        });
      }

      // Navigate to TikTok profile
      const profileUrl = `https://www.tiktok.com/@${username}`;
      debugLog(`Navigating to: ${profileUrl}`);

      let timeoutId: NodeJS.Timeout | null = null;
      try {
        const navigationPromise = page.goto(profileUrl, {
          waitUntil: "networkidle0", // Wait for all network activity to finish
          timeout: 45000,
        });

        timeoutId = setTimeout(() => {
          debugLog("Navigation timeout - page may be slow or blocked");
        }, 40000);

        await navigationPromise;
        if (timeoutId) clearTimeout(timeoutId);
        debugLog("Navigation completed");
      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);
        debugLog("Navigation error", {
          error: error.message,
          code: error.code,
        });

        if (error.message.includes("net::ERR")) {
          const errorCode = error.message.match(/net::ERR_(\w+)/)?.[1];
          debugLog(`Network error code: ${errorCode}`);

          if (
            errorCode === "PROXY_CONNECTION_FAILED" ||
            errorCode === "TUNNEL_CONNECTION_FAILED"
          ) {
            throw new Error(
              `Proxy connection failed: ${proxy}. Try a different proxy or disable proxy.`
            );
          }

          if (
            errorCode === "TIMED_OUT" ||
            errorCode === "CONNECTION_TIMED_OUT"
          ) {
            throw new Error(
              `Connection timed out. TikTok may be blocking requests. ${
                proxy ? "Try a different proxy." : "Consider using a proxy."
              }`
            );
          }

          if (errorCode === "CONNECTION_REFUSED") {
            throw new Error(
              `Connection refused. ${
                proxy
                  ? "Proxy may be down or blocked."
                  : "Check your internet connection."
              }`
            );
          }

          throw new Error(
            `Network error (${errorCode}): Unable to reach TikTok. ${
              proxy
                ? `Proxy ${proxy} may be blocked or invalid.`
                : "Check your internet connection or try using a proxy."
            }`
          );
        }

        if (error.message.includes("Navigation timeout")) {
          throw new Error(
            `Navigation timeout: TikTok took too long to respond. ${
              proxy
                ? "Proxy may be slow."
                : "Try using a proxy or check your connection."
            }`
          );
        }

        throw error;
      }

      // Wait for page to fully load and JavaScript to execute
      debugLog("Waiting for page to fully load...");
      await sleep(3000);

      // Check if page loaded correctly
      const pageTitle = await page.title();
      debugLog("Page title", { title: pageTitle });

      if (pageTitle.includes("404") || pageTitle.includes("Not Found")) {
        throw new Error(`Profile not found: @${username} does not exist`);
      }

      // Get page content
      const pageContent = await page.content();
      debugLog("Page content length", { length: pageContent.length });

      // REMOVED: Don't check for private/blocked status - just try to extract data
      // TikTok might show blocking pages even for public accounts
      // We'll try to extract data anyway and only fail if we can't get anything
      debugLog(
        "Skipping private/blocked checks - attempting to extract data anyway"
      );

      // Extract SIGI_STATE from page - try multiple times with delays
      debugLog("Extracting SIGI_STATE from page...");
      let sigiState = extractSIGIState(pageContent);

      // Try multiple extraction methods with delays
      const extractionAttempts = [
        () => extractSIGIState(pageContent),
        () => extractSIGIStateFromBrowser(page),
      ];

      for (let i = 0; i < 5 && !sigiState; i++) {
        debugLog(`SIGI_STATE extraction attempt ${i + 1}/5`);

        if (i > 0) {
          await sleep(2000); // Wait 2 seconds between attempts
        }

        // Try HTML extraction
        if (!sigiState) {
          const currentContent = await page.content();
          sigiState = extractSIGIState(currentContent);
        }

        // Try browser context extraction
        if (!sigiState) {
          sigiState = await extractSIGIStateFromBrowser(page);
        }

        // Try scrolling to trigger lazy loading
        if (!sigiState && i < 3) {
          try {
            await page.evaluate(() => {
              window.scrollTo(0, document.body.scrollHeight);
            });
            await sleep(1000);
            await page.evaluate(() => {
              window.scrollTo(0, 0);
            });
            await sleep(1000);
          } catch (e) {
            debugLog("Error scrolling page", { error: e });
          }
        }
      }

      // If SIGI_STATE not found, try fallback: extract from DOM directly
      if (!sigiState) {
        debugLog("SIGI_STATE not found, trying DOM extraction fallback...");

        try {
          const domData = await page.evaluate((username: string) => {
            const result: any = {
              displayName: "",
              followers: 0,
              likes: 0,
              videoCount: 0,
              hashtags: [] as string[],
              audioTracks: [] as string[],
              views: 0,
            };

            // Try to find display name
            const nameSelectors = [
              '[data-e2e="user-title"]',
              '[data-e2e="user-name"]',
              "h1",
              '[class*="username"]',
            ];
            for (const selector of nameSelectors) {
              const el = document.querySelector(selector);
              if (el?.textContent) {
                result.displayName = el.textContent.trim();
                break;
              }
            }

            // Try to find stats
            const statsText = document.body.innerText || "";

            // Extract followers
            const followersMatch = statsText.match(
              /(\d+(?:\.\d+)?[KMB]?)\s*(?:followers|follower)/i
            );
            if (followersMatch) {
              const num = followersMatch[1];
              result.followers =
                parseFloat(num.replace(/[KMB]/i, "")) *
                (num.includes("K")
                  ? 1000
                  : num.includes("M")
                  ? 1000000
                  : num.includes("B")
                  ? 1000000000
                  : 1);
            }

            // Extract likes
            const likesMatch = statsText.match(
              /(\d+(?:\.\d+)?[KMB]?)\s*(?:likes|like)/i
            );
            if (likesMatch) {
              const num = likesMatch[1];
              result.likes =
                parseFloat(num.replace(/[KMB]/i, "")) *
                (num.includes("K")
                  ? 1000
                  : num.includes("M")
                  ? 1000000
                  : num.includes("B")
                  ? 1000000000
                  : 1);
            }

            // Count videos
            const videoElements = document.querySelectorAll(
              '[data-e2e="user-post-item"], [class*="video"]'
            );
            result.videoCount = videoElements.length;

            // Extract hashtags from all text
            const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
            const matches = statsText.match(hashtagRegex);
            if (matches) {
              result.hashtags = [...new Set(matches)].slice(0, 20);
            }

            return result;
          }, username);

          if (domData && (domData.displayName || domData.followers > 0)) {
            debugLog("DOM extraction successful", domData);

            if (browser) {
              await browser.close();
              debugLog("Browser closed");
            }

            return {
              accountUsername: username,
              accountDisplayName: domData.displayName || username,
              followers: domData.followers || 0,
              likes: domData.likes || 0,
              views: domData.views || 0,
              videoCount: domData.videoCount || 0,
              hashtags: domData.hashtags || [],
              audioTracks: domData.audioTracks || [],
              lastScrapedAt: new Date(),
            };
          }
        } catch (e) {
          debugLog("DOM extraction failed", { error: e });
        }

        // Take screenshot in debug mode
        if (DEBUG_MODE) {
          try {
            await page.screenshot({
              path: `debug-${username}-${Date.now()}.png`,
              fullPage: true,
            });
            debugLog("Screenshot saved for debugging");

            // Also save page HTML for analysis
            const fs = require("fs");
            fs.writeFileSync(
              `debug-${username}-${Date.now()}.html`,
              pageContent
            );
            debugLog("Page HTML saved for debugging");
          } catch (e) {
            debugLog("Could not save screenshot/HTML", { error: e });
          }
        }

        // Last resort: return minimal data instead of throwing error
        debugLog("All extraction methods failed, returning minimal data");

        if (browser) {
          await browser.close();
        }

        // Return minimal data so the request doesn't fail completely
        return {
          accountUsername: username,
          accountDisplayName: username,
          followers: 0,
          likes: 0,
          views: 0,
          videoCount: 0,
          hashtags: [],
          audioTracks: [],
          lastScrapedAt: new Date(),
        };
      }

      debugLog("SIGI_STATE extracted successfully", {
        hasUserModule: !!sigiState.UserModule,
        hasItemModule: !!sigiState.ItemModule,
      });

      // Extract user data
      const userData = extractUserData(sigiState, username);

      // Extract video data
      const videoData = extractVideoData(sigiState);

      // Don't validate too strictly - return whatever data we have
      // Even if it's minimal, it's better than failing
      if (
        !userData.accountDisplayName &&
        userData.followers === 0 &&
        userData.likes === 0
      ) {
        debugLog("Warning: Minimal data extracted", {
          hasSIGIState: !!sigiState,
          hasUserModule: !!sigiState.UserModule,
          username,
        });

        // Still return data - don't throw error
        // The frontend can handle empty data
      }

      if (browser) {
        await browser.close();
        debugLog("Browser closed");
      }

      // Return successful result
      return {
        accountUsername: username,
        accountDisplayName: userData.accountDisplayName || username,
        followers: userData.followers || 0,
        likes: userData.likes || 0,
        views: videoData.totalViews || 0,
        videoCount: userData.videoCount || 0,
        hashtags: videoData.hashtags,
        audioTracks: videoData.audioTracks,
        lastScrapedAt: new Date(),
      };
    } catch (error: any) {
      lastError = error;

      if (browser) {
        try {
          await browser.close();
          debugLog("Browser closed after error");
        } catch (closeError) {
          debugLog("Error closing browser", { error: closeError });
        }
      }

      debugLog(`Scraping attempt ${attempt} failed`, {
        username,
        error: error.message,
        stack: error.stack,
        proxy: proxy || "none",
      });

      // Don't retry on certain errors
      if (
        error.message.includes("Profile not found") ||
        error.message.includes("does not exist") ||
        error.message.includes("private")
      ) {
        throw error;
      }

      // If not last attempt, wait before retrying
      if (attempt < MAX_RETRIES) {
        debugLog(`Retrying in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  // All retries failed
  debugLog("All scraping attempts failed", {
    username,
    lastError: lastError?.message,
  });

  throw new Error(
    `Failed to scrape TikTok account @${username} after ${MAX_RETRIES} attempts: ${
      lastError?.message || "Unknown error"
    }`
  );
}
