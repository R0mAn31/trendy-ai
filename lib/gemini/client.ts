/** @format */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TikTokTrend, AIAnalysis } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function analyzeTikTokTrend(
  trend: TikTokTrend,
  userProfile?: { displayName?: string; email: string }
): Promise<AIAnalysis["recommendations"]> {
  // Use gemini-2.5-flash as default (latest and fastest)
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `
You are an expert TikTok content strategist. Analyze the following TikTok account data and provide actionable recommendations.

Account Data:
- Username: ${trend.accountUsername}
- Display Name: ${trend.accountDisplayName || "N/A"}
- Followers: ${trend.followers.toLocaleString()}
- Total Likes: ${trend.likes.toLocaleString()}
- Total Views: ${trend.views.toLocaleString()}
- Video Count: ${trend.videoCount}
- Popular Hashtags: ${trend.hashtags.join(", ")}
- Popular Audio Tracks: ${trend.audioTracks.slice(0, 5).join(", ")}

Provide your analysis in the following JSON format:
{
  "hashtags": ["#hashtag1", "#hashtag2", ...],
  "audioSuggestions": ["audio name 1", "audio name 2", ...],
  "videoScripts": ["Script idea 1", "Script idea 2", ...],
  "postingTimes": ["Best time 1", "Best time 2", ...],
  "contentFormats": ["Format suggestion 1", "Format suggestion 2", ...],
  "engagementTips": ["Tip 1", "Tip 2", ...]
}

Requirements:
- Provide 10-15 relevant hashtags
- Suggest 5-7 trending audio tracks
- Generate 3-5 video script ideas (short, engaging)
- Recommend 3-5 optimal posting times
- Suggest 3-5 content formats/styles
- Provide 5-7 engagement tips

Return ONLY valid JSON, no markdown formatting.
`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    console.log("Calling Gemini API for analysis...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini response received, length:", text.length);

    // Parse JSON response (remove markdown code blocks if present)
    let jsonText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Try to extract JSON if it's wrapped in other text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    let recommendations;
    try {
      recommendations = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse JSON:", jsonText.substring(0, 200));
      // Return default structure if parsing fails
      recommendations = {
        hashtags: [],
        audioSuggestions: [],
        videoScripts: [],
        postingTimes: [],
        contentFormats: [],
        engagementTips: [],
      };
    }

    return {
      hashtags: Array.isArray(recommendations.hashtags)
        ? recommendations.hashtags
        : [],
      audioSuggestions: Array.isArray(recommendations.audioSuggestions)
        ? recommendations.audioSuggestions
        : [],
      videoScripts: Array.isArray(recommendations.videoScripts)
        ? recommendations.videoScripts
        : [],
      postingTimes: Array.isArray(recommendations.postingTimes)
        ? recommendations.postingTimes
        : [],
      contentFormats: Array.isArray(recommendations.contentFormats)
        ? recommendations.contentFormats
        : [],
      engagementTips: Array.isArray(recommendations.engagementTips)
        ? recommendations.engagementTips
        : [],
    };
  } catch (error: any) {
    console.error("Gemini API error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      apiKeySet: !!process.env.GEMINI_API_KEY,
    });
    throw new Error(
      `Failed to generate AI analysis: ${error.message || "Unknown error"}`
    );
  }
}

export async function generateVideoIdeas(
  trend: TikTokTrend,
  count: number = 10
): Promise<
  Array<{
    title: string;
    script: string;
    hashtags: string[];
    audioSuggestion: string;
    postingTime: string;
    format: string;
  }>
> {
  // Use gemini-2.5-flash as default (latest and fastest)
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `
Generate ${count} creative TikTok video ideas based on this account's data:

Account: ${trend.accountUsername}
Followers: ${trend.followers.toLocaleString()}
Popular Hashtags: ${trend.hashtags.join(", ")}
Popular Audio: ${trend.audioTracks.slice(0, 3).join(", ")}

Return JSON array with this structure:
[
  {
    "title": "Video title",
    "script": "Brief script/description",
    "hashtags": ["#hashtag1", "#hashtag2"],
    "audioSuggestion": "Audio track name",
    "postingTime": "Best posting time",
    "format": "Video format (e.g., 'Tutorial', 'Trend', 'Story')"
  }
]

Return ONLY valid JSON array, no markdown.
`;

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    console.log("Calling Gemini API for video ideas...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Gemini response received, length:", text.length);

    let jsonText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Try to extract JSON array if it's wrapped in other text
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    let ideas;
    try {
      ideas = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse JSON:", jsonText.substring(0, 200));
      return [];
    }

    return Array.isArray(ideas) ? ideas : [];
  } catch (error: any) {
    console.error("Gemini API error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      apiKeySet: !!process.env.GEMINI_API_KEY,
    });
    throw new Error(
      `Failed to generate video ideas: ${error.message || "Unknown error"}`
    );
  }
}
