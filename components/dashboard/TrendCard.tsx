'use client'

import { TikTokTrend } from '@/types'
import { Button } from '@/components/ui/Button'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

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
    <div className="card-custom p-6 animate-fade-in-up hover-lift">
      <div>
        <Link href={`/dashboard/trend/${trend.id}`}>
          <h2 className="text-2xl font-bold mb-2 text-neutral-900 hover:text-primary-600 transition-colors cursor-pointer">
            <span className="text-primary-600">@</span>{trend.accountUsername}
            {trend.accountDisplayName && (
              <span className="text-base font-normal text-neutral-600 ml-2">
                {trend.accountDisplayName}
              </span>
            )}
            <span className="text-sm text-neutral-400 ml-2">→</span>
          </h2>
        </Link>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          <div className="bg-gradient-primary/10 rounded-lg p-4 border border-primary-200">
            <div className="text-sm font-semibold text-neutral-600 mb-1">Followers</div>
            <div className="text-2xl font-bold text-primary-600">
              {trend.followers.toLocaleString()}
            </div>
          </div>
          <div className="bg-gradient-secondary/10 rounded-lg p-4 border border-secondary-200">
            <div className="text-sm font-semibold text-neutral-600 mb-1">Likes</div>
            <div className="text-2xl font-bold text-secondary-600">
              {trend.likes.toLocaleString()}
            </div>
          </div>
          <div className="bg-gradient-accent/10 rounded-lg p-4 border border-accent-200">
            <div className="text-sm font-semibold text-neutral-600 mb-1">Views</div>
            <div className="text-2xl font-bold text-accent-600">
              {trend.views.toLocaleString()}
            </div>
          </div>
          <div className="bg-neutral-100 rounded-lg p-4 border border-neutral-200">
            <div className="text-sm font-semibold text-neutral-600 mb-1">Videos</div>
            <div className="text-2xl font-bold text-neutral-700">{trend.videoCount}</div>
          </div>
        </div>

        {trend.hashtags.length > 0 && (
          <div className="my-4">
            <div className="text-sm font-semibold mb-2 text-neutral-700">Popular Hashtags:</div>
            <div className="flex flex-wrap gap-2">
              {trend.hashtags.slice(0, 5).map((tag, idx) => (
                <span key={idx} className="badge-custom">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-neutral-500 mt-4 mb-4">
          Last scraped:{' '}
          {formatDistanceToNow(trend.lastScrapedAt, { addSuffix: true })}
        </div>

        <div className="flex justify-end gap-3 mt-6">
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

