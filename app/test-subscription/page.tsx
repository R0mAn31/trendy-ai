'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'

/**
 * TEST PAGE - Subscription Management
 * 
 * ⚠️ WARNING: This page should be removed or protected in production!
 * 
 * This page allows you to manually set subscription status for testing.
 * Only works in development mode.
 */
export default function TestSubscriptionPage() {
  const { user } = useUser()
  const { subscription, isActive } = useSubscription()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [customUserId, setCustomUserId] = useState('')

  const handleSetSubscription = async (status: 'active' | 'cancelled' | 'past_due' | 'paused') => {
    if (!user && !customUserId) {
      setMessage({ type: 'error', text: 'Please sign in or enter a user ID' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const userId = customUserId || user?.id
      const response = await fetch('/api/test/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set subscription')
      }

      setMessage({ type: 'success', text: data.message })
      
      // Reload page after 1 second to see updated subscription
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update subscription' })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckSubscription = async () => {
    if (!user && !customUserId) {
      setMessage({ type: 'error', text: 'Please sign in or enter a user ID' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const userId = customUserId || user?.id
      const response = await fetch(`/api/test/subscription?userId=${userId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check subscription')
      }

      if (data.exists) {
        setMessage({
          type: 'success',
          text: `Subscription status: ${data.subscription.status}`,
        })
      } else {
        setMessage({ type: 'error', text: 'No subscription found' })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to check subscription' })
    } finally {
      setLoading(false)
    }
  }

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">This page is not available in production</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="drawer lg:drawer-open">
      <input id="drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 bg-neutral-50 min-h-screen">
          <div className="container mx-auto max-w-2xl">
            <div className="card-custom p-8">
              <h1 className="text-3xl font-bold mb-2 text-gradient-primary">
                Test Subscription Manager
              </h1>
              <p className="text-neutral-600 mb-6">
                ⚠️ Development only - Use this to manually set subscription status for testing
              </p>

              {/* Current User Info */}
              {user && (
                <div className="mb-6 p-4 bg-neutral-100 rounded-lg">
                  <h2 className="font-semibold mb-2">Current User</h2>
                  <p className="text-sm text-neutral-600">ID: {user.id}</p>
                  <p className="text-sm text-neutral-600">Email: {user.email}</p>
                </div>
              )}

              {/* Custom User ID Input */}
              <div className="mb-6">
                <Input
                  label="Or enter custom User ID"
                  placeholder="user-id-here"
                  value={customUserId}
                  onChange={(e) => setCustomUserId(e.target.value)}
                />
              </div>

              {/* Current Subscription Status */}
              <div className="mb-6 p-4 bg-neutral-100 rounded-lg">
                <h2 className="font-semibold mb-2">Current Subscription Status</h2>
                {subscription ? (
                  <div className="space-y-1">
                    <p className="text-sm">
                      Status:{' '}
                      <span
                        className={`font-bold ${
                          isActive ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {subscription.status}
                      </span>
                    </p>
                    {subscription.currentPeriodEnd && (
                      <p className="text-sm text-neutral-600">
                        Period End:{' '}
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-600">No active subscription</p>
                )}
              </div>

              {/* Message Display */}
              {message && (
                <div
                  className={`mb-6 p-4 rounded-lg ${
                    message.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="primary"
                    onClick={() => handleSetSubscription('active')}
                    loading={loading}
                    disabled={!user && !customUserId}
                  >
                    Set Active
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSetSubscription('cancelled')}
                    loading={loading}
                    disabled={!user && !customUserId}
                  >
                    Set Cancelled
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSetSubscription('past_due')}
                    loading={loading}
                    disabled={!user && !customUserId}
                  >
                    Set Past Due
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSetSubscription('paused')}
                    loading={loading}
                    disabled={!user && !customUserId}
                  >
                    Set Paused
                  </Button>
                </div>

                <Button
                  variant="secondary"
                  onClick={handleCheckSubscription}
                  loading={loading}
                  disabled={!user && !customUserId}
                  className="w-full"
                >
                  Check Subscription Status
                </Button>
              </div>

              {/* Instructions */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold mb-2 text-blue-900">How to use:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Sign in to your account (or enter a user ID manually)</li>
                  <li>Click &quot;Set Active&quot; to give yourself an active subscription</li>
                  <li>Refresh the dashboard to see the subscription take effect</li>
                  <li>Use &quot;Set Cancelled&quot; to test paywall behavior</li>
                </ol>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Sidebar />
    </div>
  )
}

