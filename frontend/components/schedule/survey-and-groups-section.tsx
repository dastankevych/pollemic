"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { cn } from "@/lib/utils"

interface SurveyAndGroupsSectionProps {
    selectedSurvey: string
    setSelectedSurvey: (value: string) => void
    selectedGroups: string[]
    setSelectedGroups: (value: string[]) => void
    targetGroups: { label: string; value: string }[]
    formErrors: Record<string, string | null>
}

export function SurveyAndGroupsSection({
                                           selectedSurvey,
                                           setSelectedSurvey,
                                           selectedGroups,
                                           setSelectedGroups,
                                           targetGroups,
                                           formErrors = {},
                                       }: SurveyAndGroupsSectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Select Survey and Groups</CardTitle>
                <CardDescription>Choose a survey and target groups</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="survey" className={cn(formErrors?.survey && "text-destructive")}>
                        Survey {formErrors?.survey && <span className="text-xs">- {formErrors.survey}</span>}
                    </Label>
                    <Select value={selectedSurvey} onValueChange={setSelectedSurvey}>
                        <SelectTrigger id="survey" className={cn(formErrors?.survey && "border-destructive")}>
                            <SelectValue placeholder="Select a survey" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Course Feedback</SelectItem>
                            <SelectItem value="2">Teaching Evaluation</SelectItem>
                            <SelectItem value="3">Student Satisfaction</SelectItem>
                            <SelectItem value="4">Learning Experience</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="groups" className={cn(formErrors?.groups && "text-destructive")}>
                        Target Groups {formErrors?.groups && <span className="text-xs">- {formErrors.groups}</span>}
                    </Label>
                    <MultiSelect
                        options={targetGroups}
                        selected={selectedGroups}
                        onChange={setSelectedGroups}
                        placeholder="Select target groups"
                        className={cn(formErrors?.groups && "border-destructive")}
                    />
                    {selectedGroups.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {selectedGroups.length} group{selectedGroups.length !== 1 ? "s" : ""} selected
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
