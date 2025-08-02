"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { User, TokenResponse } from "@/types/auth";
import { fetchWithAuth, getWithAuth } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  checkAuth: async () => false,
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Call login API
      const response = await fetch("/api/auth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data: TokenResponse = await response.json();
      
      // Store token in localStorage
      localStorage.setItem("token", data.access_token);
      
      // Get user info
      await fetchUserInfo();
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  // Check if user is authenticated
  const checkAuth = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return false;
      }

      await fetchUserInfo();
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Auth check error:", error);
      localStorage.removeItem("token");
      setIsLoading(false);
      return false;
    }
  };

  // Fetch user info
  const fetchUserInfo = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return;
    }

    try {
      // Use the getWithAuth utility function
      const userData = await getWithAuth<User>("/api/auth/me");
      setUser(userData);
    } catch (error) {
      console.error("Fetch user info error:", error);
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}