import React from "react"
import { getReports } from "@/lib/actions/reports"
import { ReportsTable } from "@/components/reports/data-table"
import { ReportFilters } from "@/components/reports/report-filters"
import { formatDuration } from "@/lib/utils"
import { AddManualEntryDialog } from "@/components/reports/add-entry-dialog"
import nextDynamic from "next/dynamic"

const EfficiencyChart = nextDynamic(() => import("@/components/reports/efficiency-chart").then(mod => mod.EfficiencyChart), { loading: () => <div className="h-[300px] w-full bg-white/5 animate-pulse rounded-3xl" /> })

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ReportsPage(props: { searchParams?: { start?: string, end?: string, range?: string } }) {
  const searchParams = props.searchParams ? await Promise.resolve(props.searchParams) : {};
  
  const range = searchParams.range || "today"
  
  const filter: any = {}
  if (searchParams.start && searchParams.end) {
    filter.startDate = new Date(searchParams.start)
    filter.endDate = new Date(searchParams.end)
  } else if (range === "today") {
    // Default to today's data if no start/end provided
    const today = new Date()
    today.setHours(0,0,0,0)
    const end = new Date()
    end.setHours(23,59,59,999)
    filter.startDate = today
    filter.endDate = end
  }

  const data = await getReports(filter)

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2">
            Reports & Insights
          </h1>
          <p className="text-muted-foreground tracking-wide">
            Analyze your time distribution and export data.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <AddManualEntryDialog categories={data.categories} />
        </div>
      </header>

      <ReportFilters entries={data.entries} />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Time Summary */}
        <div className="glass p-6 rounded-2xl flex flex-col justify-center items-center shadow-xl">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Total Time</h3>
          <div className="text-5xl font-light neon-text">
            {formatDuration(data.totalSeconds)}
          </div>
        </div>

        {/* Efficiency Chart */}
        <div className="md:col-span-2">
          <EfficiencyChart data={data.efficiencyData} />
        </div>

        {/* Category Breakdown */}
        <div className="glass p-6 rounded-2xl md:col-span-3 shadow-xl mt-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Time by Category</h3>
          <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
            {data.byCategory.length === 0 ? (
              <span className="text-muted-foreground/50">No data for selected period.</span>
            ) : (
              data.byCategory.map(cat => (
                <div key={cat.name} className="flex-shrink-0 bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center min-w-[120px]">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{cat.name}</span>
                  <span className="text-xl font-mono text-foreground">{(cat.duration / 3600).toFixed(1)}h</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="mt-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">Time Entries log</h3>
        <ReportsTable entries={data.entries} categories={data.categories} />
      </section>
    </div>
  )
}
