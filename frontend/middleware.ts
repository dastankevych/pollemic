import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware handles API routing and authentication redirection
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if it's an API request
  if (pathname.startsWith('/api/')) {
    // Split the path to extract the actual endpoint
    // Strip '/api' prefix to route to the actual API server
    const apiPath = pathname.substring(4) // Remove '/api'

    // Create the URL to forward to
    const apiUrl = new URL(apiPath, process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

    // Copy all search params
    request.nextUrl.searchParams.forEach((value, key) => {
      apiUrl.searchParams.append(key, value)
    })

    // Create the rewrite response
    console.log(`Rewriting API request from ${pathname} to ${apiUrl.toString()}`)
    return NextResponse.rewrite(apiUrl)
  }

  // Handle authentication redirects for protected routes
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/surveys') ||
    pathname.startsWith('/settings')
  ) {
    // Check if we have auth token in cookies or local storage
    // Note: We cannot access localStorage in middleware, so we use cookies
    const authToken = request.cookies.get('auth_token')

    if (!authToken) {
      // Redirect to login page with return URL
      const url = new URL('/login', request.url)
      url.searchParams.set('returnUrl', pathname)
      return NextResponse.redirect(url)
    }
  }

  // For all other routes, continue normal processing
  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // API routes
    '/api/:path*',

    // Protected pages
    '/admin/:path*',
    '/dashboard/:path*',
    '/surveys/:path*',
    '/settings/:path*',
  ],
}