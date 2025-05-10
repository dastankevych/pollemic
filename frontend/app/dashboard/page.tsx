"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { FileText, Calendar, BarChart } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()

  return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          {isAdmin && (
              <Button asChild>
                <Link href="/admin/dashboard">Admin Dashboard</Link>
              </Button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Surveys
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">14</div>
              <p className="text-xs text-muted-foreground">
                2 new this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Schedule
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Surveys scheduled for this week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Response Rates
              </CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">63%</div>
              <p className="text-xs text-muted-foreground">
                Average completion rate
              </p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="surveys">My Surveys</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Welcome, {user?.full_name}</CardTitle>
                <CardDescription>
                  You are logged in as a {user?.role === 'mentor' ? 'Mentor' : 'User'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <p>From this dashboard, you can:</p>
                <ul className="list-disc pl-6 pt-2 space-y-2">
                  <li>View and create surveys</li>
                  <li>Schedule surveys for your classes</li>
                  <li>View anonymized responses</li>
                  <li>Generate reports on student feedback</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="surveys" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Surveys</CardTitle>
                <CardDescription>
                  Surveys you've created or have access to
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <p>No surveys available yet.</p>
                <Button className="mt-4">
                  <Link href="/dashboard/surveys">View All Surveys</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Survey Results</CardTitle>
                <CardDescription>
                  Anonymized results from recent surveys
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <p>No results available yet.</p>
                <Button className="mt-4">
                  <Link href="/dashboard/results">View All Results</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  )
}