'use client'

import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'
import { signOut } from 'firebase/auth'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export function Topbar() {
  const [user, loading] = useAuthState(auth)
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut(auth)
    router.push('/')
  }

  return (
    <div className="navbar bg-white shadow-md border-b border-neutral-200">
      <div className="flex-none lg:hidden">
        <label htmlFor="drawer" className="btn btn-square btn-ghost hover:bg-neutral-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-5 h-5 stroke-neutral-700"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </label>
      </div>
      <div className="flex-1">
        <Link href="/" className="text-xl font-bold text-gradient-primary hover:opacity-80 transition-opacity">
          Trendy AI
        </Link>
      </div>
      <div className="flex-none gap-2">
        {loading ? (
          <span className="loading loading-spinner loading-sm text-primary-600" />
        ) : user ? (
          <>
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar hover:bg-neutral-100">
                <div className="w-10 rounded-full ring-2 ring-primary-200 hover:ring-primary-400 transition-all">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="bg-gradient-primary text-white flex items-center justify-center w-full h-full font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </label>
              <ul
                tabIndex={0}
                className="mt-3 z-[1] p-2 shadow-lg menu menu-sm dropdown-content bg-white rounded-xl w-52 border border-neutral-200"
              >
                <li>
                  <Link href="/profile" className="text-neutral-700 hover:bg-neutral-100 hover:text-primary-600">
                    Profile
                  </Link>
                </li>
                <li>
                  <button onClick={handleSignOut} className="text-red-600 hover:bg-red-50">
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <Button onClick={() => router.push('/auth/login')} variant="primary">
            Sign In
          </Button>
        )}
      </div>
    </div>
  )
}

