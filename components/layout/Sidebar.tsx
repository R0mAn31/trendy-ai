'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

type NavigationItem = {
  name: string
  href: string
  icon: string
  devOnly?: boolean
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Profile', href: '/profile', icon: '👤' },
  { name: 'Test Subscription', href: '/test-subscription', icon: '🧪', devOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="drawer-side">
      <label htmlFor="drawer" className="drawer-overlay" />
      <aside className="w-64 min-h-full bg-white border-r border-neutral-200">
        <div className="p-6 border-b border-neutral-200">
          <Link href="/" className="text-2xl font-bold text-gradient-primary">
            Trendy AI
          </Link>
        </div>
        <ul className="menu p-4 w-full">
          {navigation
            .filter((item) => {
              // Hide dev-only items in production builds
              if (item.devOnly) {
                return typeof window !== 'undefined' && window.location.hostname === 'localhost'
              }
              return true
            })
            .map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                    pathname === item.href
                      ? 'bg-gradient-primary text-white shadow-md shadow-primary-500/30'
                      : 'text-neutral-700 hover:bg-neutral-100 hover:text-primary-600'
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-semibold">{item.name}</span>
                </Link>
              </li>
            ))}
        </ul>
      </aside>
    </div>
  )
}

