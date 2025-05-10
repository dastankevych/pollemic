import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Paths that don't require authentication
const publicPaths = [
    '/',
    '/login',
    '/about',
    '/contact',
    '/terms',
    '/privacy',
    '/forgot-password'
]

// Paths that require admin access
const adminPaths = [
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/settings'
]

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Check if the path is public
    if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
        return NextResponse.next()
    }

    // Get the authentication token
    const authToken = request.cookies.get('auth_token')?.value

    // If there's no token, redirect to login
    if (!authToken) {
        const url = new URL('/login', request.url)
        url.searchParams.set('callbackUrl', encodeURI(pathname))
        return NextResponse.redirect(url)
    }

    // For paths requiring admin access, check user role
    if (adminPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
        try {
            // This is a simplified approach - in a real app, you'd verify the token properly
            const payload = JSON.parse(atob(authToken.split('.')[1]))
            const userRole = payload.role

            if (userRole !== 'university_admin') {
                // Redirect non-admin users to regular dashboard
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        } catch (error) {
            // If token is invalid, redirect to login
            const url = new URL('/login', request.url)
            url.searchParams.set('callbackUrl', encodeURI(pathname))
            return NextResponse.redirect(url)
        }
    }

    return NextResponse.next()
}

export const config = {
    // Specify which paths should run the middleware
    matcher: [
        // Match all paths except API routes, static files, and public static files
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
    ],
}