"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { login } from "@/services/auth-service"
import { useAuth } from "@/components/auth-provider"
import { debugAuthIssues, fixAuthIssues } from "@/lib/auth-debug"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { login: authLogin } = useAuth()

  // Check for returnUrl param
  const returnUrl = searchParams.get('returnUrl') || '/dashboard'

  useEffect(() => {
    // Check for any auth issues on page load
    const checkAuthIssues = async () => {
      try {
        const debug = await debugAuthIssues();
        console.log("Auth debug:", debug);

        // Automatically fix issues if debug detects problems
        if (debug.status === 'issues_found') {
          const fix = await fixAuthIssues();
          console.log("Auth fix attempt:", fix);

          if (fix.action === 'redirect_to_login') {
            // Already on login page, so just show info toast
            toast({
              title: "Session cleared",
              description: "Your previous session data was invalid and has been cleared.",
            });
          }
        }
      } catch (error) {
        console.error("Auth debugging failed:", error);
      }
    };

    checkAuthIssues();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorDetails(null)

    try {
      // Call the auth service to log in
      const response = await login({
        username,
        password
      })

      // Show success message
      toast({
        title: "Login successful",
        description: `Welcome back, ${response.user?.full_name || username}!`,
      })

      // Update auth context
      authLogin(returnUrl)

      // The redirection is handled in the login function and auth provider
    } catch (error) {
      console.error("Login error:", error);

      // Show detailed error message
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
      })

      // Debug auth issues on failure
      try {
        const debug = await debugAuthIssues();
        if (debug.status === 'issues_found') {
          setErrorDetails(debug.recommendations.join(" "));
        }
      } catch (e) {
        console.error("Debug failed:", e);
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFixAuthIssues = async () => {
    setIsLoading(true);
    try {
      const result = await fixAuthIssues();
      toast({
        title: result.fixed ? "Issues fixed" : "Fix attempted",
        description: result.message,
      });

      if (result.action === 'redirect_to_login') {
        // Already on login page, just refresh the page
        window.location.reload();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fixing issues",
        description: "An error occurred while trying to fix authentication issues.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

            {errorDetails && (
              <div className="bg-destructive/10 p-3 rounded-md">
                <p className="text-sm text-destructive">{errorDetails}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={handleFixAuthIssues}
                >
                  Attempt to fix issues
                </Button>
              </div>
            )}
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