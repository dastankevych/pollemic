"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth-provider";
import { debugAuthIssues, fixAuthIssues } from "@/lib/auth-debug";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [authStatus, setAuthStatus] = useState<{
    status: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    // Check authentication on component mount
    const checkAuth = async () => {
      if (!isLoading) {
        // If not authenticated after loading, redirect to login
        if (!user) {
          router.push("/login?returnUrl=/admin/dashboard");
          return;
        }

        // If user is not an admin, redirect to appropriate dashboard
        if (user.role !== "university_admin") {
          toast({
            title: "Access Restricted",
            description: "You don't have permission to access the admin dashboard.",
          });
          router.push("/dashboard");
          return;
        }

        // Verify authentication status
        try {
          const debug = await debugAuthIssues();
          if (debug.status !== "authenticated") {
            setAuthStatus({
              status: "warning",
              message: "There might be authentication issues. Please check your connection.",
            });
          } else {
            setAuthStatus({
              status: "success",
              message: "Authentication verified successfully.",
            });
          }
        } catch (error) {
          console.error("Auth verification error:", error);
        }
      }
    };

    checkAuth();
  }, [isLoading, user, router, toast]);

  const handleFixAuth = async () => {
    try {
      const result = await fixAuthIssues();

      toast({
        title: result.fixed ? "Fixed" : "Action Required",
        description: result.message,
      });

      if (result.action === "redirect_to_login") {
        logout();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fix authentication issues. Please try logging in again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Loading dashboard...</h2>
          <p className="text-muted-foreground">Please wait while we verify your authentication.</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "university_admin") {
    // This shouldn't normally be seen as useEffect should redirect
    return null;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="mb-6 flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.full_name || "Administrator"}!
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push("/admin/profile")}>Profile</Button>
          <Button variant="outline" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </div>

      {authStatus && authStatus.status === "warning" && (
        <Card className="mb-6 border-yellow-500">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold text-yellow-600">Authentication Warning</h3>
                <p>{authStatus.message}</p>
              </div>
              <Button variant="outline" className="mt-2 md:mt-0" onClick={handleFixAuth}>
                Fix Issues
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="surveys">Surveys</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Active Surveys</CardTitle>
                <CardDescription>Currently running surveys</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">12</div>
                <p className="text-sm text-muted-foreground">+2 from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Responses</CardTitle>
                <CardDescription>Across all surveys</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">324</div>
                <p className="text-sm text-muted-foreground">+28 in the last 24 hours</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Active Groups</CardTitle>
                <CardDescription>Student groups in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">8</div>
                <p className="text-sm text-muted-foreground">No change since last week</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Overview of recent survey activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg p-2 hover:bg-muted">
                  <div>
                    <p className="font-medium">End of Semester Survey created</p>
                    <p className="text-sm text-muted-foreground">Created by Administrator</p>
                  </div>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
                <div className="flex items-center justify-between rounded-lg p-2 hover:bg-muted">
                  <div>
                    <p className="font-medium">Course Feedback Survey assigned to Group A</p>
                    <p className="text-sm text-muted-foreground">Assigned by Administrator</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Yesterday</p>
                </div>
                <div className="flex items-center justify-between rounded-lg p-2 hover:bg-muted">
                  <div>
                    <p className="font-medium">Teaching Quality Survey completed</p>
                    <p className="text-sm text-muted-foreground">24 responses received</p>
                  </div>
                  <p className="text-sm text-muted-foreground">3 days ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="surveys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Survey Management</CardTitle>
              <CardDescription>Manage all your surveys from here</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/admin/surveys")}>
                View All Surveys
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Management</CardTitle>
              <CardDescription>Manage student groups</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/admin/groups")}>
                View All Groups
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription>View survey analytics and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/admin/reports")}>
                View Reports
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}