"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { login } from "@/services/auth-service"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Call the auth service to log in
      const response = await login({
        username,
        password
      })

      // Show success message
      toast({
        title: "Login successful",
        description: `Welcome back, ${response.user?.full_name}!`,
      })

      // Redirect based on user role
      if (response.user?.role === "university_admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      // Show error message
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Login to Pollemic</CardTitle>
            <CardDescription>Enter your Telegram username and password to access your account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Telegram Username</Label>
                <Input
                    id="username"
                    type="text"
                    placeholder="Username without @ symbol"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <p className="text-xs text-muted-foreground">
                  Use <strong>admin</strong> for admin access or <strong>mentor1</strong>/<strong>mentor2</strong> for mentor access
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-primary underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <p className="text-xs text-muted-foreground">
                  For testing, use <strong>admin123</strong> or <strong>mentor123</strong> respectively
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
                  Contact administrator
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
  )
}