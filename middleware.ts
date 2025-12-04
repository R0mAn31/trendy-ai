import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/profile']
  const authRoutes = ['/auth/login', '/auth/register']

  const { pathname } = request.nextUrl

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Get auth token from cookies or headers
  // Note: In production, you should verify the Firebase auth token server-side
  const token = request.cookies.get('auth-token')?.value

  // For MVP, we'll let the client-side handle auth checks
  // In production, you should verify Firebase tokens here
  // TODO: Implement proper Firebase token verification

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}



