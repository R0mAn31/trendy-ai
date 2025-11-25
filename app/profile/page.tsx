'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useSubscription } from '@/hooks/useSubscription'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Paywall } from '@/components/paywall/Paywall'
import { format } from 'date-fns'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, loading: userLoading } = useUser()
  const { subscription, isActive, loading: subscriptionLoading } = useSubscription()
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
    }
  }, [user])

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      // TODO: Update user profile in Firestore
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
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
          <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
          <a href="/auth/login" className="btn btn-primary">
            Sign In
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="drawer lg:drawer-open">
      <input id="drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 bg-base-200">
          <div className="container mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">Profile</h1>

            <div className="card bg-base-100 shadow-xl mb-6">
              <div className="card-body">
                <h2 className="card-title mb-4">Account Information</h2>
                <Input label="Email" value={user.email} disabled />
                <Input
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <div className="card-actions justify-end mt-4">
                  <Button onClick={handleSave} loading={saving}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">Subscription Status</h2>
                {isActive && subscription ? (
                  <div className="space-y-2">
                    <p>
                      <span className="font-semibold">Status:</span>{' '}
                      <span className="badge badge-success">{subscription.status}</span>
                    </p>
                    {subscription.currentPeriodEnd && (
                      <p>
                        <span className="font-semibold">Renews:</span>{' '}
                        {format(subscription.currentPeriodEnd, 'PPP')}
                      </p>
                    )}
                    {subscription.cancelAtPeriodEnd && (
                      <p className="text-warning">
                        Subscription will cancel at the end of the current period.
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="mb-4">No active subscription</p>
                    <Link href="/paywall">
                      <Button>Subscribe Now</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
      <Sidebar />
    </div>
  )
}

