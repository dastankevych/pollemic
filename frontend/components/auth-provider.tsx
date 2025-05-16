"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isAuthenticated, getCurrentUser, initializeAuth, logout } from '@/services/auth-service'
import { User } from '@/services/user-service'

// Define the auth context type
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isLoggedIn: boolean
  login: (path?: string) => void
  logout: () => void
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
})

// Hook to use auth context
export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      await initializeAuth()

      // Check if user is authenticated
      if (isAuthenticated()) {
        setUser(getCurrentUser())
      } else {
        setUser(null)
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  useEffect(() => {
    // Handle authentication-required routes
    if (!isLoading) {
      const isAuthRoute =
        pathname?.includes('/admin') ||
        pathname?.includes('/dashboard') ||
        pathname?.includes('/surveys') ||
        pathname?.includes('/settings');

      if (isAuthRoute && !isAuthenticated()) {
        // Redirect to login if trying to access protected routes while not logged in
        router.push(`/login?returnUrl=${encodeURIComponent(pathname || '/dashboard')}`)
      }

      // Redirect from login page if already logged in
      if (pathname === '/login' && isAuthenticated()) {
        // If user is admin, go to admin dashboard, otherwise regular dashboard
        const user = getCurrentUser()
        if (user?.role === 'university_admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    }
  }, [pathname, isLoading, router])

  const loginHandler = (path = '/dashboard') => {
    if (isAuthenticated()) {
      const user = getCurrentUser()
      setUser(user)

      // Redirect based on role
      if (user?.role === 'university_admin') {
        router.push('/admin/dashboard')
      } else {
        router.push(path)
      }
    }
  }

  const logoutHandler = () => {
    logout()
    setUser(null)
    router.push('/login')
  }

  const value = {
    user,
    isLoading,
    isLoggedIn: !!user,
    login: loginHandler,
    logout: logoutHandler,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}