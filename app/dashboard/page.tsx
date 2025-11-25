'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useSubscription } from '@/hooks/useSubscription'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { TrendCard } from '@/components/dashboard/TrendCard'
import { AIResult } from '@/components/dashboard/AIResult'
import { Paywall } from '@/components/paywall/Paywall'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { getSavedTrendsCollectionPath } from '@/lib/firebase/collections'
import type { TikTokTrend, AIAnalysis } from '@/types'

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser()
  const { isActive, loading: subscriptionLoading } = useSubscription()
  const [trends, setTrends] = useState<TikTokTrend[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [username, setUsername] = useState('')
  const [scraping, setScraping] = useState(false)
  const [analyzingTrendId, setAnalyzingTrendId] = useState<string | null>(null)
  const [generatingTrendId, setGeneratingTrendId] = useState<string | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AIAnalysis | null>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)

  const loadTrends = async () => {
    if (!user) return

    try {
      const trendsRef = collection(db, getSavedTrendsCollectionPath(user.id))
      const trendsSnapshot = await getDocs(trendsRef)
      const trendsData = trendsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        lastScrapedAt: doc.data().lastScrapedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as TikTokTrend[]

      setTrends(trendsData)
    } catch (error) {
      console.error('Error loading trends:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && isActive) {
      loadTrends()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isActive])

  const handleScrape = async () => {
    if (!user || !username.trim()) return

    setScraping(true)
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), userId: user.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to scrape account')
      }

      const data = await response.json()
      setUsername('')
      setShowAddModal(false)
      await loadTrends()
    } catch (error) {
      console.error('Scraping error:', error)
      alert('Failed to scrape account. Please try again.')
    } finally {
      setScraping(false)
    }
  }

  const handleAnalyze = async (trendId: string) => {
    if (!user) return

    setAnalyzingTrendId(trendId)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trendId, userId: user.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze')
      }

      const analysis = await response.json()
      setSelectedAnalysis(analysis)
      setShowAnalysisModal(true)
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Failed to generate analysis. Please try again.')
    } finally {
      setAnalyzingTrendId(null)
    }
  }

  const handleGenerateIdeas = async (trendId: string) => {
    if (!user) return

    setGeneratingTrendId(trendId)
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trendId, userId: user.id, generateIdeas: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate ideas')
      }

      const ideas = await response.json()
      alert(`Generated ${ideas.length} video ideas! Check the analysis for details.`)
    } catch (error) {
      console.error('Ideas generation error:', error)
      alert('Failed to generate ideas. Please try again.')
    } finally {
      setGeneratingTrendId(null)
    }
  }

  if (userLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to access the dashboard</h1>
          <a href="/auth/login" className="btn btn-primary">
            Sign In
          </a>
        </div>
      </div>
    )
  }

  if (!isActive) {
    return <Paywall />
  }

  return (
    <div className="drawer lg:drawer-open">
      <input id="drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 bg-neutral-50 min-h-screen">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold text-gradient-primary">Dashboard</h1>
              <Button onClick={() => setShowAddModal(true)} variant="primary">
                Add TikTok Account
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary-600" />
              </div>
            ) : trends.length === 0 ? (
              <div className="text-center py-12 animate-fade-in">
                <p className="text-xl mb-4 text-neutral-600">No TikTok accounts added yet.</p>
                <Button onClick={() => setShowAddModal(true)} variant="primary">
                  Add Your First Account
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {trends.map((trend) => (
                  <TrendCard
                    key={trend.id}
                    trend={trend}
                    onAnalyze={handleAnalyze}
                    onGenerateIdeas={handleGenerateIdeas}
                    analyzing={analyzingTrendId === trend.id}
                    generating={generatingTrendId === trend.id}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <Sidebar />

      {/* Add Account Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add TikTok Account"
      >
        <div className="space-y-4">
          <Input
            label="TikTok Username"
            placeholder="username (without @)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleScrape} loading={scraping} disabled={!username.trim()}>
              Scrape Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* Analysis Modal */}
      <Modal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        title="AI Analysis"
        size="xl"
      >
        {selectedAnalysis && <AIResult analysis={selectedAnalysis} />}
      </Modal>
    </div>
  )
}

