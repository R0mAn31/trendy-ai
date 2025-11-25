'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { Topbar } from '@/components/layout/Topbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function PaywallPage() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/paddle/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout')
      }

      const data = await response.json()
      // Redirect to Paddle checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to create checkout session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="drawer lg:drawer-open">
      <input id="drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 bg-base-200">
          <div className="container mx-auto max-w-4xl">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h1 className="text-4xl font-bold text-center mb-4">🔒 Premium Subscription</h1>
                <p className="text-center text-lg mb-8">
                  Unlock AI-powered TikTok analytics and recommendations
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-base-200 rounded-lg">
                    <h3 className="text-2xl font-bold mb-4">What You Get</h3>
                    <ul className="space-y-2">
                      <li>✅ Unlimited TikTok account analysis</li>
                      <li>✅ AI-powered content recommendations</li>
                      <li>✅ Generate 10 video ideas per account</li>
                      <li>✅ Optimal posting time suggestions</li>
                      <li>✅ Hashtag and audio recommendations</li>
                      <li>✅ Video script generation</li>
                      <li>✅ Regular account scraping</li>
                    </ul>
                  </div>

                  <div className="p-6 bg-primary text-primary-content rounded-lg">
                    <h3 className="text-2xl font-bold mb-4">Pricing</h3>
                    <div className="text-4xl font-bold mb-2">$12/month</div>
                    <p className="mb-4">Cancel anytime. No hidden fees.</p>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={handleSubscribe}
                      loading={loading}
                      className="w-full"
                    >
                      Subscribe Now
                    </Button>
                  </div>
                </div>

                <div className="text-center text-sm text-base-content/70">
                  <p>Secure payment processing by Paddle</p>
                  <p>Your subscription will be managed through Paddle</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Sidebar />
    </div>
  )
}

