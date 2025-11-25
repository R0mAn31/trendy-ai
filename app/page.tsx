import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <div className="hero min-h-screen bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="hero-content text-center text-white relative z-10 animate-fade-in">
          <div className="max-w-2xl">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 animate-fade-in-up">
              <span className="text-gradient-primary bg-clip-text text-transparent bg-white">
                TikTok Trends AI
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 animate-fade-in-up animation-delay-200">
              Analyze TikTok accounts with AI-powered insights. Get personalized recommendations for hashtags, audio tracks, video scripts, and optimal posting times.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
              <Link href="/auth/login">
                <Button size="lg" variant="primary" className="bg-white text-primary-600 hover:bg-neutral-100">
                  Get Started
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient-primary">
            How It Works
          </h2>
          <p className="text-center text-neutral-600 mb-12 text-lg">Simple steps to unlock your TikTok potential</p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-custom p-6 hover-lift animate-fade-in-up">
              <div className="text-5xl mb-4 animate-bounce-subtle">1️⃣</div>
              <h3 className="text-xl font-bold mb-3 text-neutral-900">Connect Your Account</h3>
              <p className="text-neutral-600">Sign up with email or Google and connect your TikTok account for analysis.</p>
            </div>
            <div className="card-custom p-6 hover-lift animate-fade-in-up animation-delay-200">
              <div className="text-5xl mb-4 animate-bounce-subtle animation-delay-200">2️⃣</div>
              <h3 className="text-xl font-bold mb-3 text-neutral-900">AI Analysis</h3>
              <p className="text-neutral-600">Our AI analyzes your account metrics, trends, and content to provide insights.</p>
            </div>
            <div className="card-custom p-6 hover-lift animate-fade-in-up animation-delay-400">
              <div className="text-5xl mb-4 animate-bounce-subtle animation-delay-400">3️⃣</div>
              <h3 className="text-xl font-bold mb-3 text-neutral-900">Get Recommendations</h3>
              <p className="text-neutral-600">Receive personalized hashtags, audio suggestions, video scripts, and posting times.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 bg-neutral-100">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-gradient-secondary">
            Features
          </h2>
          <p className="text-center text-neutral-600 mb-12 text-lg">Everything you need to grow your TikTok presence</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 p-6 bg-white rounded-xl hover-lift hover-glow transition-all">
              <div className="text-4xl animate-bounce-subtle">📊</div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-neutral-900">Account Analytics</h3>
                <p className="text-neutral-600">Track followers, likes, views, and engagement metrics over time.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 bg-white rounded-xl hover-lift hover-glow transition-all">
              <div className="text-4xl animate-bounce-subtle animation-delay-200">🤖</div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-neutral-900">AI-Powered Insights</h3>
                <p className="text-neutral-600">Get intelligent recommendations powered by Gemini 3 AI.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 bg-white rounded-xl hover-lift hover-glow transition-all">
              <div className="text-4xl animate-bounce-subtle animation-delay-400">🎬</div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-neutral-900">Video Ideas</h3>
                <p className="text-neutral-600">Generate 10 creative video ideas tailored to your account.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 bg-white rounded-xl hover-lift hover-glow transition-all">
              <div className="text-4xl animate-bounce-subtle animation-delay-600">⏰</div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-neutral-900">Optimal Posting Times</h3>
                <p className="text-neutral-600">Discover the best times to post for maximum engagement.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 bg-gradient-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-fade-in-up">Ready to Grow Your TikTok?</h2>
          <p className="text-xl mb-8 text-white/90 animate-fade-in-up animation-delay-200">Start analyzing your account today with AI-powered insights.</p>
          <Link href="/auth/login" className="animate-fade-in-up animation-delay-400 inline-block">
            <Button size="lg" variant="secondary" className="bg-white text-primary-600 hover:bg-neutral-100">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-neutral-900 text-neutral-300">
        <div>
          <p className="font-bold text-lg text-white">Trendy AI</p>
          <p className="text-neutral-400">AI-powered TikTok analytics and recommendations</p>
        </div>
        <div>
          <p className="text-neutral-500">© 2024 Trendy AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

