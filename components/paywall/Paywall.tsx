'use client'

import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

interface PaywallProps {
  message?: string
}

export function Paywall({ message }: PaywallProps) {
  const router = useRouter()

  const handleSubscribe = () => {
    router.push('/paywall')
  }

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">🔒 Premium Required</h1>
          <p className="py-6">
            {message ||
              'This feature requires an active subscription. Subscribe now to unlock AI-powered TikTok analytics and recommendations.'}
          </p>
          <Button size="lg" onClick={handleSubscribe}>
            Subscribe Now - $12/month
          </Button>
        </div>
      </div>
    </div>
  )
}



