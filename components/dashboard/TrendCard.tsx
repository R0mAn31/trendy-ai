'use client'

import { TikTokTrend } from '@/types'
import { Button } from '@/components/ui/Button'
import { formatDistanceToNow } from 'date-fns'

interface TrendCardProps {
  trend: TikTokTrend
  onAnalyze: (trendId: string) => void
  onGenerateIdeas: (trendId: string) => void
  analyzing?: boolean
  generating?: boolean
}

export function TrendCard({
  trend,
  onAnalyze,
  onGenerateIdeas,
  analyzing,
  generating,
}: TrendCardProps) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">
          @{trend.accountUsername}
          {trend.accountDisplayName && (
            <span className="text-base font-normal text-base-content/70">
              {trend.accountDisplayName}
            </span>
          )}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-4">
          <div className="stat py-2">
            <div className="stat-title">Followers</div>
            <div className="stat-value text-lg">
              {trend.followers.toLocaleString()}
            </div>
          </div>
          <div className="stat py-2">
            <div className="stat-title">Likes</div>
            <div className="stat-value text-lg">
              {trend.likes.toLocaleString()}
            </div>
          </div>
          <div className="stat py-2">
            <div className="stat-title">Views</div>
            <div className="stat-value text-lg">
              {trend.views.toLocaleString()}
            </div>
          </div>
          <div className="stat py-2">
            <div className="stat-title">Videos</div>
            <div className="stat-value text-lg">{trend.videoCount}</div>
          </div>
        </div>

        {trend.hashtags.length > 0 && (
          <div className="my-2">
            <div className="text-sm font-semibold mb-1">Popular Hashtags:</div>
            <div className="flex flex-wrap gap-2">
              {trend.hashtags.slice(0, 5).map((tag, idx) => (
                <span key={idx} className="badge badge-primary badge-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-base-content/60 mt-2">
          Last scraped:{' '}
          {formatDistanceToNow(trend.lastScrapedAt, { addSuffix: true })}
        </div>

        <div className="card-actions justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => onAnalyze(trend.id)}
            loading={analyzing}
            disabled={analyzing || generating}
          >
            Analyze with AI
          </Button>
          <Button
            variant="primary"
            onClick={() => onGenerateIdeas(trend.id)}
            loading={generating}
            disabled={analyzing || generating}
          >
            Generate 10 Ideas
          </Button>
        </div>
      </div>
    </div>
  )
}

