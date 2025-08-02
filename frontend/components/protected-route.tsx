"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

/**
 * A component that protects routes by checking if the user is authenticated
 * and optionally if they have the required role.
 * 
 * @param children The content to render if the user is authenticated
 * @param requiredRole Optional role that the user must have to access the route
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    // If role is required and user doesn't have it, redirect to dashboard
    if (
      !isLoading && 
      isAuthenticated && 
      requiredRole && 
      user?.role !== requiredRole
    ) {
      router.push("/dashboard");
      return;
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  // Show nothing while loading or if not authenticated
  if (isLoading || !isAuthenticated) {
    return null;
  }

  // If role is required and user doesn't have it, show nothing
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  // If authenticated and has required role (or no role required), show children
  return <>{children}</>;
}