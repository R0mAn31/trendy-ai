import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="hero min-h-screen bg-gradient-to-br from-primary to-secondary">
        <div className="hero-content text-center text-primary-content">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold mb-6">
              TikTok Trends AI
            </h1>
            <p className="text-xl mb-8">
              Analyze TikTok accounts with AI-powered insights. Get personalized recommendations for hashtags, audio tracks, video scripts, and optimal posting times.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/login">
                <Button size="lg" variant="secondary">
                  Get Started
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-base-100">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="text-4xl mb-4">1️⃣</div>
                <h3 className="card-title">Connect Your Account</h3>
                <p>Sign up with email or Google and connect your TikTok account for analysis.</p>
              </div>
            </div>
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="text-4xl mb-4">2️⃣</div>
                <h3 className="card-title">AI Analysis</h3>
                <p>Our AI analyzes your account metrics, trends, and content to provide insights.</p>
              </div>
            </div>
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <div className="text-4xl mb-4">3️⃣</div>
                <h3 className="card-title">Get Recommendations</h3>
                <p>Receive personalized hashtags, audio suggestions, video scripts, and posting times.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 bg-base-200">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="text-3xl">📊</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Account Analytics</h3>
                <p>Track followers, likes, views, and engagement metrics over time.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">🤖</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
                <p>Get intelligent recommendations powered by Gemini 3 AI.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">🎬</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Video Ideas</h3>
                <p>Generate 10 creative video ideas tailored to your account.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">⏰</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Optimal Posting Times</h3>
                <p>Discover the best times to post for maximum engagement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 bg-primary text-primary-content">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Grow Your TikTok?</h2>
          <p className="text-xl mb-8">Start analyzing your account today with AI-powered insights.</p>
          <Link href="/auth/login">
            <Button size="lg" variant="secondary">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-300 text-base-content">
        <div>
          <p className="font-bold text-lg">Trendy AI</p>
          <p>AI-powered TikTok analytics and recommendations</p>
        </div>
        <div>
          <p>© 2024 Trendy AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

