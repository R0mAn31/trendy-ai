'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { TikTokTrend, AIAnalysis, VideoIdea, TrendContext } from '@/types'
import { formatDistanceToNow } from 'date-fns'

export default function TrendDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const trendId = params.trendId as string

  const [trend, setTrend] = useState<TikTokTrend | null>(null)
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([])
  const [ideas, setIdeas] = useState<VideoIdea[]>([])
  const [context, setContext] = useState<TrendContext | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingContext, setSavingContext] = useState(false)
  const [contextNotes, setContextNotes] = useState('')
  const [generatingIdeas, setGeneratingIdeas] = useState(false)
  const [showAddIdeaModal, setShowAddIdeaModal] = useState(false)
  const [newIdea, setNewIdea] = useState({
    title: '',
    script: '',
    hashtags: '',
    audioSuggestion: '',
    postingTime: '',
    format: '',
  })
  const [deletingIdeaId, setDeletingIdeaId] = useState<string | null>(null)

  useEffect(() => {
    if (user && trendId) {
      loadTrendDetails()
    }
  }, [user, trendId])

  const loadTrendDetails = async () => {
    if (!user) return

    setLoading(true)
    try {
      console.log('Loading trend details:', { trendId, userId: user.id })
      const response = await fetch(`/api/trend/${encodeURIComponent(trendId)}?userId=${user.id}`)
      const data = await response.json()

      console.log('Trend API response:', data)

      if (data.success) {
        setTrend(data.trend)
        setAnalyses(data.analyses || [])
        setIdeas(data.ideas || [])
        if (data.context) {
          setContext(data.context)
          setContextNotes(data.context.notes || '')
        }
      } else {
        console.error('Failed to load trend:', data.error, data.debug)
        alert(`Failed to load trend: ${data.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('Failed to load trend details:', error)
      alert(`Failed to load trend: ${error.message || 'Network error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveContext = async () => {
    if (!user || !trendId) return

    setSavingContext(true)
    try {
      const response = await fetch(`/api/trend/${trendId}/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          notes: contextNotes,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setContext(data.context)
        alert('Context saved successfully!')
      }
    } catch (error) {
      console.error('Failed to save context:', error)
      alert('Failed to save context')
    } finally {
      setSavingContext(false)
    }
  }

  const handleGenerateIdeas = async () => {
    if (!user || !trendId) return

    setGeneratingIdeas(true)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trendId,
          userId: user.id,
          generateIdeas: true,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate ideas')
      }

      if (data.success && data.ideas) {
        // Reload trend details to show new ideas
        await loadTrendDetails()
        alert(`✅ Generated ${data.ideas.length} video ideas!`)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      console.error('Failed to generate ideas:', error)
      alert(`Failed to generate ideas: ${error.message}`)
    } finally {
      setGeneratingIdeas(false)
    }
  }

  const handleAddIdea = async () => {
    if (!user || !trendId) return

    if (!newIdea.title || !newIdea.script) {
      alert('Title and script are required')
      return
    }

    try {
      const hashtagsArray = newIdea.hashtags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag)

      const ideaData = {
        title: newIdea.title,
        script: newIdea.script,
        hashtags: hashtagsArray,
        audioSuggestion: newIdea.audioSuggestion || 'N/A',
        postingTime: newIdea.postingTime || 'Anytime',
        format: newIdea.format || 'General',
      }

      const response = await fetch(`/api/trend/${trendId}/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ideas: [ideaData],
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShowAddIdeaModal(false)
        setNewIdea({
          title: '',
          script: '',
          hashtags: '',
          audioSuggestion: '',
          postingTime: '',
          format: '',
        })
        await loadTrendDetails()
        alert('Idea added successfully!')
      } else {
        throw new Error(data.error || 'Failed to add idea')
      }
    } catch (error: any) {
      console.error('Failed to add idea:', error)
      alert(`Failed to add idea: ${error.message}`)
    }
  }

  const handleDeleteIdea = async (ideaId: string) => {
    if (!user || !trendId) return

    if (!confirm('Are you sure you want to delete this idea?')) {
      return
    }

    setDeletingIdeaId(ideaId)
    try {
      const response = await fetch(
        `/api/trend/${trendId}/ideas/${ideaId}?userId=${user.id}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()

      if (data.success) {
        await loadTrendDetails()
        alert('Idea deleted successfully!')
      } else {
        throw new Error(data.error || 'Failed to delete idea')
      }
    } catch (error: any) {
      console.error('Failed to delete idea:', error)
      alert(`Failed to delete idea: ${error.message}`)
    } finally {
      setDeletingIdeaId(null)
    }
  }

  if (userLoading || loading) {
    return (
      <div className="drawer lg:drawer-open">
        <input id="drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          <Topbar />
          <div className="min-h-screen flex items-center justify-center">
            <span className="loading loading-spinner loading-lg text-primary-500" />
          </div>
        </div>
        <Sidebar />
      </div>
    )
  }

  if (!trend) {
    return (
      <div className="drawer lg:drawer-open">
        <input id="drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col">
          <Topbar />
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Trend not found</h1>
              <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
            </div>
          </div>
        </div>
        <Sidebar />
      </div>
    )
  }

  return (
    <div className="drawer lg:drawer-open">
      <input id="drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 bg-neutral-50 min-h-screen">
          <div className="container mx-auto max-w-6xl">
            {/* Header */}
            <div className="mb-6">
              <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4">
                ← Back to Dashboard
              </Button>
              <h1 className="text-4xl font-bold mb-2 text-gradient-primary">
                @{trend.accountUsername}
              </h1>
              {trend.accountDisplayName && (
                <p className="text-xl text-neutral-600">{trend.accountDisplayName}</p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="card-custom p-4">
                <div className="text-sm font-semibold text-neutral-600 mb-1">Followers</div>
                <div className="text-2xl font-bold text-primary-600">
                  {trend.followers.toLocaleString()}
                </div>
              </div>
              <div className="card-custom p-4">
                <div className="text-sm font-semibold text-neutral-600 mb-1">Likes</div>
                <div className="text-2xl font-bold text-secondary-600">
                  {trend.likes.toLocaleString()}
                </div>
              </div>
              <div className="card-custom p-4">
                <div className="text-sm font-semibold text-neutral-600 mb-1">Views</div>
                <div className="text-2xl font-bold text-accent-600">
                  {trend.views.toLocaleString()}
                </div>
              </div>
              <div className="card-custom p-4">
                <div className="text-sm font-semibold text-neutral-600 mb-1">Videos</div>
                <div className="text-2xl font-bold text-neutral-700">{trend.videoCount}</div>
              </div>
            </div>

            {/* Context/Notes Section */}
            <div className="card-custom p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gradient-primary">Context & Notes</h2>
              <textarea
                className="textarea textarea-bordered w-full min-h-[150px] mb-4"
                placeholder="Add your notes, context, or observations about this account..."
                value={contextNotes}
                onChange={(e) => setContextNotes(e.target.value)}
              />
              <Button
                variant="primary"
                onClick={handleSaveContext}
                loading={savingContext}
                disabled={savingContext}
              >
                Save Context
              </Button>
            </div>

            {/* AI Analyses */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-gradient-primary">
                AI Analyses ({analyses.length})
              </h2>
              {analyses.length === 0 ? (
                <div className="card-custom p-6 text-center text-neutral-500">
                  No analyses yet. Generate one from the dashboard.
                </div>
              ) : (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <div key={analysis.id} className="card-custom p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold">
                          Analysis from {formatDistanceToNow(analysis.generatedAt, { addSuffix: true })}
                        </h3>
                        <span className="text-sm text-neutral-500">
                          {new Date(analysis.generatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Hashtags */}
                        {analysis.recommendations.hashtags.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-primary-600">Hashtags</h4>
                            <div className="flex flex-wrap gap-2">
                              {analysis.recommendations.hashtags.map((tag, idx) => (
                                <span key={idx} className="badge badge-primary">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Audio Suggestions */}
                        {analysis.recommendations.audioSuggestions.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-secondary-600">Audio Suggestions</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {analysis.recommendations.audioSuggestions.map((audio, idx) => (
                                <li key={idx} className="text-sm">{audio}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Video Scripts */}
                        {analysis.recommendations.videoScripts.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-accent-600">Video Scripts</h4>
                            <ul className="list-disc list-inside space-y-2">
                              {analysis.recommendations.videoScripts.map((script, idx) => (
                                <li key={idx} className="text-sm">{script}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Posting Times */}
                        {analysis.recommendations.postingTimes.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-primary-600">Posting Times</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {analysis.recommendations.postingTimes.map((time, idx) => (
                                <li key={idx} className="text-sm">{time}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Content Formats */}
                        {analysis.recommendations.contentFormats.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-secondary-600">Content Formats</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {analysis.recommendations.contentFormats.map((format, idx) => (
                                <li key={idx} className="text-sm">{format}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Engagement Tips */}
                        {analysis.recommendations.engagementTips.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2 text-accent-600">Engagement Tips</h4>
                            <ul className="list-disc list-inside space-y-1">
                              {analysis.recommendations.engagementTips.map((tip, idx) => (
                                <li key={idx} className="text-sm">{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video Ideas */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gradient-primary">
                Generated Video Ideas ({ideas.length})
              </h2>
              {ideas.length === 0 ? (
                <div className="card-custom p-6 text-center text-neutral-500">
                  No video ideas yet. Generate some from the dashboard.
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {ideas.map((idea, idx) => (
                    <div key={idea.id || idx} className="card-custom p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-primary-700">{idea.title}</h3>
                        {idea.createdAt && (
                          <span className="text-xs text-neutral-500">
                            {formatDistanceToNow(idea.createdAt, { addSuffix: true })}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-neutral-700 mb-4">{idea.script}</p>

                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-semibold text-neutral-600">Format: </span>
                          <span className="text-xs text-neutral-700">{idea.format}</span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-neutral-600">Posting Time: </span>
                          <span className="text-xs text-neutral-700">{idea.postingTime}</span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-neutral-600">Audio: </span>
                          <span className="text-xs text-neutral-700">{idea.audioSuggestion}</span>
                        </div>
                        {idea.hashtags.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold text-neutral-600">Hashtags: </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {idea.hashtags.map((tag, tagIdx) => (
                                <span key={tagIdx} className="badge badge-sm badge-primary">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <Sidebar />
    </div>
  )
}

