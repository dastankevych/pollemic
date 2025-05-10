"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { User } from "@/services/user-service"
import { isAuthenticated, getCurrentUser, logout } from "@/services/auth-service"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
    user: User | null
    isLoading: boolean
    isAdmin: boolean
    isMentor: boolean
    logout: () => void
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    isAdmin: false,
    isMentor: false,
    logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

interface AuthProviderProps {
    children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()
    const { toast } = useToast()

    // Public paths that don't require authentication
    const publicPaths = ['/', '/login', '/about', '/contact', '/terms', '/privacy']
    const isPublicPath = publicPaths.includes(pathname)

    useEffect(() => {
        const loadUser = async () => {
            setIsLoading(true)
            try {
                if (isAuthenticated()) {
                    const currentUser = getCurrentUser()
                    setUser(currentUser)
                } else if (!isPublicPath) {
                    // If not authenticated and not on a public path, redirect to login
                    router.push('/login')
                }
            } catch (error) {
                console.error("Auth error:", error)
                toast({
                    variant: "destructive",
                    title: "Authentication Error",
                    description: "Please login again to continue."
                })
                handleLogout()
            } finally {
                setIsLoading(false)
            }
        }

        loadUser()
    }, [pathname, router, toast, isPublicPath])

    const handleLogout = () => {
        logout()
        setUser(null)
        router.push('/login')
    }

    const isAdmin = user?.role === 'university_admin'
    const isMentor = user?.role === 'mentor'

    return (
        <AuthContext.Provider
            value={{
        user,
            isLoading,
            isAdmin,
            isMentor,
            logout: handleLogout
    }}
>
    {children}
    </AuthContext.Provider>
)
}