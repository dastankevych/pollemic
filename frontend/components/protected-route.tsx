"use client"

import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
    children: ReactNode
    adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
    const { user, isLoading, isAdmin } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading) {
            // If not authenticated, redirect to login
            if (!user) {
                router.push("/login")
            }
            // If admin-only route and user is not an admin
            else if (adminOnly && !isAdmin) {
                router.push("/dashboard")
            }
        }
    }, [user, isLoading, isAdmin, adminOnly, router])

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // If authentication requirements are satisfied, render children
    if (user && (!adminOnly || isAdmin)) {
        return <>{children}</>
    }

    // This return is needed for TypeScript, but should never be rendered
    // as the useEffect above will redirect as needed
    return null
}