import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { SidebarNav } from "@/components/sidebar-nav"

export default function CreatePollPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <SidebarNav />
        <main className="flex w-full flex-col overflow-hidden">
          <DashboardShell className="mb-1">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" asChild className="mr-2">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Link>
              </Button>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Create New Poll</h2>
                <p className="text-muted-foreground">Design your poll and share it with your Telegram channels.</p>
              </div>
            </div>
          </DashboardShell>

          <div className="p-4 md:p-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Poll Details</CardTitle>
                <CardDescription>Set the basic information for your poll.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Poll Title</Label>
                  <Input id="title" placeholder="Enter a descriptive title for your poll" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide additional context for your poll"
                    className="min-h-[100px]"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="channel">Target Channel</Label>
                    <Select>
                      <SelectTrigger id="channel">
                        <SelectValue placeholder="Select a channel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cs101">CS101 Group</SelectItem>
                        <SelectItem value="math202">Math 202</SelectItem>
                        <SelectItem value="eng303">Engineering 303</SelectItem>
                        <SelectItem value="student-council">Student Council</SelectItem>
                        <SelectItem value="campus-life">Campus Life</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Poll Duration</Label>
                    <Select>
                      <SelectTrigger id="duration">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">1 hour</SelectItem>
                        <SelectItem value="6h">6 hours</SelectItem>
                        <SelectItem value="12h">12 hours</SelectItem>
                        <SelectItem value="1d">1 day</SelectItem>
                        <SelectItem value="3d">3 days</SelectItem>
                        <SelectItem value="7d">1 week</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Question 1</CardTitle>
                <CardDescription>Configure your first question.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question-text">Question Text</Label>
                  <Input id="question-text" placeholder="Enter your question" />
                </div>
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <RadioGroup defaultValue="multiple-choice" className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="multiple-choice" id="multiple-choice" />
                      <Label htmlFor="multiple-choice">Multiple Choice</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="single-choice" id="single-choice" />
                      <Label htmlFor="single-choice">Single Choice</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="text" id="text" />
                      <Label htmlFor="text">Text Response</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rating" id="rating" />
                      <Label htmlFor="rating">Rating Scale</Label>
                    </div>
                  </RadioGroup>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Answer Options</Label>
                    <Button variant="outline" size="sm">
                      Add Option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Input placeholder="Option 1" />
                      <Button variant="ghost" size="icon" className="shrink-0">
                        ×
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input placeholder="Option 2" />
                      <Button variant="ghost" size="icon" className="shrink-0">
                        ×
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input placeholder="Option 3" />
                      <Button variant="ghost" size="icon" className="shrink-0">
                        ×
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Add Question</Button>
                <Button variant="outline">Preview</Button>
              </CardFooter>
            </Card>

            <div className="flex justify-end space-x-2">
              <Button variant="outline">Save as Draft</Button>
              <Button>Publish Poll</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

