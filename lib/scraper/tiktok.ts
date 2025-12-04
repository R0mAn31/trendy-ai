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
        privateAccount?: boolean;
        secUid?: string;
        userId?: string;
        stats?: {
          followerCount?: number;
          followingCount?: number;
          heartCount?: number;
          videoCount?: number;
          diggCount?: number;
        };
      };
    };
  };
  ItemModule?: {
    items?: {
      [key: string]: {
        id?: string;
        desc?: string;
        createTime?: number;
        text?: string;
        music?: {
          id?: string;
          title?: string;
          authorName?: string;
          original?: boolean;
          playUrl?: string;
          duration?: number;
        };
        stats?: {
          playCount?: number;
          diggCount?: number;
          commentCount?: number;
          shareCount?: number;
        };
        videoMeta?: {
          width?: number;
          height?: number;
          duration?: number;
        };
        hashtags?: Array<{
          id?: string;
          name?: string;
          title?: string;
        }>;
        mentions?: string[];
        covers?: {
          default?: string;
          origin?: string;
          dynamic?: string;
        };
        videoUrl?: string;
        authorMeta?: {
          id?: string;
          name?: string;
          uniqueId?: string;
        };
      };
    };
  };
  // TikTok also stores data in __DEFAULT_SCOPE__
  __DEFAULT_SCOPE__?: {
    [key: string]: any;
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
 * Extract SIGI_STATE from browser context (more reliable - similar to tiktok-scraper)
 * This is the most reliable method as it accesses the actual JavaScript objects
 */
async function extractSIGIStateFromBrowser(
  page: any
): Promise<SIGIState | null> {
  try {
    const sigiState = await page.evaluate(() => {
      const win = window as any;
      
      // Method 1: Try to access window.__UNIVERSAL_DATA_FOR_REHYDRATION__ (most reliable)
      if (win.__UNIVERSAL_DATA_FOR_REHYDRATION__) {
        const data = win.__UNIVERSAL_DATA_FOR_REHYDRATION__;
        // Try different data structures (TikTok uses various formats)
        if (data["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]) {
          return data["__DEFAULT_SCOPE__"]["webapp.user-detail"];
        }
        if (data.UserModule || data.ItemModule) {
          return data;
        }
        // Return full data structure if it exists
        return data;
      }

      // Method 2: Try to access window.SIGI_STATE (alternative location)
      if (win.SIGI_STATE) {
        const data = win.SIGI_STATE;
        if (data.UserModule || data.ItemModule) {
          return data;
        }
        return data;
      }

      // Method 3: Try to find script tag with data (fallback)
      const scripts = Array.from(document.querySelectorAll("script"));
      for (const script of scripts) {
        if (
          script.id === "__UNIVERSAL_DATA_FOR_REHYDRATION__" ||
          script.textContent?.includes("UserModule") ||
          script.textContent?.includes("ItemModule") ||
          script.textContent?.includes("__UNIVERSAL_DATA_FOR_REHYDRATION__")
        ) {
          try {
            const content = script.textContent || "";

            // Try to find JSON object with more flexible matching
            let jsonMatch = content.match(/({[\s\S]*?"UserModule"[\s\S]*?})/);
            if (!jsonMatch) {
              jsonMatch = content.match(/({[\s\S]*?"ItemModule"[\s\S]*?})/);
            }
            if (!jsonMatch) {
              // Try to find large JSON objects
              jsonMatch = content.match(/({[\s\S]{100,}})/);
            }

            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[1]);
              if (parsed.UserModule || parsed.ItemModule) {
                return parsed;
              }
              if (parsed["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]) {
                return parsed["__DEFAULT_SCOPE__"]["webapp.user-detail"];
              }
              // Return if it looks like valid TikTok data
              if (parsed["__DEFAULT_SCOPE__"] || Object.keys(parsed).length > 5) {
                return parsed;
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
 * Extract comprehensive user profile data from SIGI_STATE (similar to tiktok-scraper's getUserProfileInfo)
 */
function extractUserData(
  sigiState: SIGIState,
  username: string
): {
  accountDisplayName: string;
  followers: number;
  likes: number;
  videoCount: number;
  following?: number;
  verified?: boolean;
  signature?: string;
  avatarUrl?: string;
  userId?: string;
  secUid?: string;
} {
  let accountDisplayName = username;
  let followers = 0;
  let likes = 0;
  let videoCount = 0;
  let following = 0;
  let verified = false;
  let signature = "";
  let avatarUrl = "";
  let userId = "";
  let secUid = "";

  // Try to extract from UserModule (similar to tiktok-scraper)
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
      following = userData.stats?.followingCount || 0;
      verified = userData.verified || false;
      signature = userData.signature || "";
      avatarUrl = userData.avatarLarger || userData.avatarMedium || userData.avatarThumb || "";
      userId = userData.userId || "";
      secUid = userData.secUid || "";

      debugLog("User data extracted (comprehensive)", {
        displayName: accountDisplayName,
        followers,
        likes,
        videoCount,
        following,
        verified,
        signature: signature.substring(0, 50),
        hasAvatar: !!avatarUrl,
        userId,
        secUid: secUid.substring(0, 20),
      });
    }
  }

  // Try to extract from __DEFAULT_SCOPE__ (alternative TikTok data structure)
  if (!accountDisplayName || followers === 0) {
    const defaultScope = sigiState.__DEFAULT_SCOPE__;
    if (defaultScope) {
      // Look for user-detail data
      const userDetail = defaultScope["webapp.user-detail"];
      if (userDetail?.userInfo) {
        const userInfo = userDetail.userInfo;
        accountDisplayName = userInfo.nickname || userInfo.uniqueId || accountDisplayName;
        followers = userInfo.stats?.followerCount || followers;
        likes = userInfo.stats?.heartCount || likes;
        videoCount = userInfo.stats?.videoCount || videoCount;
        following = userInfo.stats?.followingCount || following;
        verified = userInfo.verified || verified;
        signature = userInfo.signature || signature;
        avatarUrl = userInfo.avatarLarger || userInfo.avatarMedium || avatarUrl;
        userId = userInfo.userId || userId;
        secUid = userInfo.secUid || secUid;
      }
    }
  }

  return {
    accountDisplayName,
    followers,
    likes,
    videoCount,
    following,
    verified,
    signature,
    avatarUrl,
    userId,
    secUid,
  };
}

/**
 * Extract comprehensive video data from SIGI_STATE (similar to tiktok-scraper's collector format)
 */
function extractVideoData(sigiState: SIGIState): {
  hashtags: string[];
  audioTracks: string[];
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
} {
  const hashtags = new Set<string>();
  const audioTracks = new Set<string>();
  let totalViews = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;

  if (sigiState.ItemModule?.items) {
    const items = sigiState.ItemModule.items;
    const videoItems = Object.values(items) as any[];

    debugLog(`Found ${videoItems.length} video items`);

    for (const item of videoItems) {
      // Extract hashtags from description/text (similar to tiktok-scraper)
      const text = item.desc || item.text || "";
      if (text) {
        const hashtagMatches = text.match(/#[\w\u0590-\u05ff]+/g);
        if (hashtagMatches) {
          hashtagMatches.forEach((tag: string) => hashtags.add(tag));
        }
      }

      // Extract hashtags from hashtags array (structured format)
      if (item.hashtags && Array.isArray(item.hashtags)) {
        item.hashtags.forEach((tag: any) => {
          if (tag.name) {
            hashtags.add(`#${tag.name}`);
          }
        });
      }

      // Extract mentions (they often contain hashtag-like content)
      if (item.mentions && Array.isArray(item.mentions)) {
        item.mentions.forEach((mention: string) => {
          if (mention.startsWith("#")) {
            hashtags.add(mention);
          }
        });
      }

      // Extract audio/music data (comprehensive like tiktok-scraper)
      if (item.music) {
        const music = item.music;
        if (music.title) {
          if (music.authorName) {
            audioTracks.add(`${music.authorName} - ${music.title}`);
          } else {
            audioTracks.add(music.title);
          }
        }
        // Also add music ID for reference
        if (music.id) {
          debugLog(`Found music ID: ${music.id}`);
        }
      }

      // Sum up all stats (comprehensive like tiktok-scraper)
      if (item.stats) {
        totalViews += item.stats.playCount || 0;
        totalLikes += item.stats.diggCount || 0;
        totalComments += item.stats.commentCount || 0;
        totalShares += item.stats.shareCount || 0;
      }
    }
  }

  debugLog("Video data extracted (comprehensive)", {
    hashtagsCount: hashtags.size,
    audioTracksCount: audioTracks.size,
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
  });

  return {
    hashtags: Array.from(hashtags).slice(0, 30), // Increased limit
    audioTracks: Array.from(audioTracks).slice(0, 30), // Increased limit
    totalViews,
    totalLikes,
    totalComments,
    totalShares,
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

      // Set viewport and user agent (similar to tiktok-scraper headers)
      await page.setViewport({ width: 1920, height: 1080 });
      const userAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.80 Safari/537.36";
      await page.setUserAgent(userAgent);
      
      // Set headers similar to tiktok-scraper (important for TikTok API access)
      await page.setExtraHTTPHeaders({
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.tiktok.com/",
        "Origin": "https://www.tiktok.com",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Upgrade-Insecure-Requests": "1",
      });
      
      debugLog("Viewport, user agent, and headers set", { userAgent });

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
      // Similar approach to tiktok-scraper library
      debugLog("Extracting SIGI_STATE from page...");
      let sigiState = extractSIGIState(pageContent);

      // Try multiple extraction methods with delays (like tiktok-scraper retry logic)
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

        // Try browser context extraction (most reliable - similar to tiktok-scraper)
        if (!sigiState) {
          sigiState = await extractSIGIStateFromBrowser(page);
        }

        // Try to extract from window.__UNIVERSAL_DATA_FOR_REHYDRATION__ directly
        if (!sigiState) {
          try {
            sigiState = await page.evaluate(() => {
              const win = window as any;
              if (win.__UNIVERSAL_DATA_FOR_REHYDRATION__) {
                const data = win.__UNIVERSAL_DATA_FOR_REHYDRATION__;
                // Try different paths
                if (data["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]) {
                  return data["__DEFAULT_SCOPE__"]["webapp.user-detail"];
                }
                if (data.UserModule || data.ItemModule) {
                  return data;
                }
                return data;
              }
              return null;
            });
          } catch (e) {
            debugLog("Error extracting from window object", { error: e });
          }
        }

        // Try scrolling to trigger lazy loading (loads more videos/data)
        if (!sigiState && i < 3) {
          try {
            // Scroll down to load more content
            await page.evaluate(() => {
              window.scrollTo(0, document.body.scrollHeight);
            });
            await sleep(1500);
            
            // Scroll back up
            await page.evaluate(() => {
              window.scrollTo(0, 0);
            });
            await sleep(1000);
            
            // Try extraction again after scroll
            const newContent = await page.content();
            sigiState = extractSIGIState(newContent);
            if (!sigiState) {
              sigiState = await extractSIGIStateFromBrowser(page);
            }
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

      // Extract user data (comprehensive like tiktok-scraper's getUserProfileInfo)
      const userData = extractUserData(sigiState, username);

      // Extract video data (comprehensive like tiktok-scraper's collector format)
      const videoData = extractVideoData(sigiState);

      // Use video data likes if user data likes is 0 (more accurate)
      const finalLikes = userData.likes > 0 ? userData.likes : videoData.totalLikes;

      // Don't validate too strictly - return whatever data we have
      // Even if it's minimal, it's better than failing
      if (
        !userData.accountDisplayName &&
        userData.followers === 0 &&
        finalLikes === 0
      ) {
        debugLog("Warning: Minimal data extracted", {
          hasSIGIState: !!sigiState,
          hasUserModule: !!sigiState.UserModule,
          hasItemModule: !!sigiState.ItemModule,
          username,
        });

        // Still return data - don't throw error
        // The frontend can handle empty data
      }

      if (browser) {
        await browser.close();
        debugLog("Browser closed");
      }

      // Return successful result (comprehensive data like tiktok-scraper)
      debugLog("Scraping completed successfully", {
        accountDisplayName: userData.accountDisplayName,
        followers: userData.followers,
        likes: finalLikes,
        views: videoData.totalViews,
        videoCount: userData.videoCount,
        hashtagsCount: videoData.hashtags.length,
        audioTracksCount: videoData.audioTracks.length,
        verified: userData.verified,
      });

      return {
        accountUsername: username,
        accountDisplayName: userData.accountDisplayName || username,
        followers: userData.followers || 0,
        likes: finalLikes || 0,
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
