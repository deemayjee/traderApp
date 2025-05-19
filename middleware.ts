import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if the user is trying to access a protected route
  const isProtectedRoute = !request.nextUrl.pathname.startsWith('/beta-access')

  if (isProtectedRoute) {
    // Check if the user has been verified
    const isVerified = request.cookies.get('betaAccessVerified')?.value === 'true'

    if (!isVerified) {
      // Redirect to the beta access verification page
      return NextResponse.redirect(new URL('/beta-access', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 