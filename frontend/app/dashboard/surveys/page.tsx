import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SurveysTable } from "@/components/dashboard/surveys-table"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export default function SurveysPage() {
  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader heading="Surveys" text="Create and manage your surveys.">
        <Link href="/dashboard/surveys/create">
          <Button size="sm" className="h-9">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Survey
          </Button>
        </Link>
      </DashboardHeader>
      <SurveysTable />
    </div>
  )
}

