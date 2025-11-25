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
    <div className="navbar bg-base-100 shadow-lg">
      <div className="flex-none lg:hidden">
        <label htmlFor="drawer" className="btn btn-square btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-5 h-5 stroke-current"
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
        <Link href="/" className="btn btn-ghost text-xl">
          Trendy AI
        </Link>
      </div>
      <div className="flex-none gap-2">
        {loading ? (
          <span className="loading loading-spinner loading-sm" />
        ) : user ? (
          <>
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="bg-primary text-primary-content flex items-center justify-center w-full h-full">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </label>
              <ul
                tabIndex={0}
                className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
              >
                <li>
                  <Link href="/profile">Profile</Link>
                </li>
                <li>
                  <button onClick={handleSignOut}>Logout</button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <Button onClick={() => router.push('/auth/login')}>Sign In</Button>
        )}
      </div>
    </div>
  )
}

