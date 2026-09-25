import React from "react"
import { getTeamReports } from "@/lib/actions/reports"
import { requireAuth } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { TeamReportView } from "@/components/reports/team-report-view"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function TeamReportsPage(props: { searchParams?: { month?: string, year?: string } }) {
  const currentUser = await requireAuth()
  if (currentUser.role !== "MANAGER" && currentUser.role !== "ADMIN") {
    redirect("/")
  }

  const searchParams = props.searchParams ? await Promise.resolve(props.searchParams) : {};
  
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  
  const month = parseInt(searchParams.month || currentMonth.toString(), 10)
  const year = parseInt(searchParams.year || currentYear.toString(), 10)

  const data = await getTeamReports(month, year)

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto py-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2">
            Team Utilization & 1:1 Dashboard
          </h1>
          <p className="text-muted-foreground tracking-wide">
            Monthly utilization metrics and weekly 1:1 sync log.
          </p>
        </div>
      </header>

      <TeamReportView 
        data={data} 
        month={month} 
        year={year} 
      />
    </div>
  )
}
