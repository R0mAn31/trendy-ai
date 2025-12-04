'use client'

import { AIAnalysis } from '@/types'
import { formatDistanceToNow } from 'date-fns'

interface AIResultProps {
  analysis: AIAnalysis
}

export function AIResult({ analysis }: AIResultProps) {
  const { recommendations } = analysis

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">AI Analysis Results</h2>
        <div className="text-xs text-base-content/60 mb-4">
          Generated {formatDistanceToNow(analysis.generatedAt, { addSuffix: true })}
        </div>

        <div className="space-y-6">
          {/* Hashtags */}
          {recommendations.hashtags.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Recommended Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {recommendations.hashtags.map((tag, idx) => (
                  <span key={idx} className="badge badge-primary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Audio Suggestions */}
          {recommendations.audioSuggestions.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Audio Suggestions</h3>
              <ul className="list-disc list-inside space-y-1">
                {recommendations.audioSuggestions.map((audio, idx) => (
                  <li key={idx}>{audio}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Video Scripts */}
          {recommendations.videoScripts.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Video Script Ideas</h3>
              <div className="space-y-3">
                {recommendations.videoScripts.map((script, idx) => (
                  <div key={idx} className="p-3 bg-base-200 rounded-lg">
                    <p>{script}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posting Times */}
          {recommendations.postingTimes.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Optimal Posting Times</h3>
              <ul className="list-disc list-inside space-y-1">
                {recommendations.postingTimes.map((time, idx) => (
                  <li key={idx}>{time}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Content Formats */}
          {recommendations.contentFormats.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Content Formats</h3>
              <div className="flex flex-wrap gap-2">
                {recommendations.contentFormats.map((format, idx) => (
                  <span key={idx} className="badge badge-secondary">
                    {format}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Engagement Tips */}
          {recommendations.engagementTips.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Engagement Tips</h3>
              <ul className="list-disc list-inside space-y-1">
                {recommendations.engagementTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



