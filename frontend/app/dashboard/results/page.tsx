import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResultsOverview } from "@/components/dashboard/results-overview"
import { ResultsComparison } from "@/components/dashboard/results-comparison"

export default function ResultsPage() {
  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader heading="Survey Results" text="View and analyze your survey results." />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Results Overview</CardTitle>
              <CardDescription>View aggregated results from your surveys</CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsOverview />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Results Comparison</CardTitle>
              <CardDescription>Compare results across different time periods or student groups</CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsComparison />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Results</CardTitle>
              <CardDescription>Export your survey results in various formats</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center text-muted-foreground">
              Export functionality will be displayed here
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

