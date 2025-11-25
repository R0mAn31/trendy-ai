'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { useRouter } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Profile', href: '/profile', icon: '👤' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="drawer-side">
      <label htmlFor="drawer" className="drawer-overlay" />
      <aside className="w-64 min-h-full bg-base-200">
        <div className="p-4">
          <Link href="/" className="text-2xl font-bold">
            Trendy AI
          </Link>
        </div>
        <ul className="menu p-4 w-full">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3',
                  pathname === item.href && 'active'
                )}
              >
                <span>{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}

