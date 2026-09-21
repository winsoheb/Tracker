import React from "react"
import { requireManager } from "@/lib/auth-utils"
import { getTeamPlannedVsActual, getTeamTaskStats, getOverdueAndBlockedTasks } from "@/lib/reports/engine"
import { startOfWeek, endOfWeek, subWeeks, subDays } from "date-fns"
import { LineChart, ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react"

export const metadata = {
  title: "Team Trends | WorkOrbit",
}

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function TrendIndicator({ current, previous, type = "positive-is-good" }: { current: number, previous: number, type?: "positive-is-good" | "negative-is-good" }) {
  const diff = current - previous
  const diffHoursStr = formatHours(Math.abs(diff))
  
  if (diff === 0) {
    return <span className="flex items-center text-sm text-muted-foreground"><Minus className="w-4 h-4 mr-1" /> No change</span>
  }
  
  const isPositive = diff > 0
  const isGood = type === "positive-is-good" ? isPositive : !isPositive
  const colorClass = isGood ? "text-green-500" : "text-red-500"
  
  return (
    <span className={`flex items-center text-sm ${colorClass}`}>
      {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
      {isPositive ? "+" : "-"}{diffHoursStr} vs last period
    </span>
  )
}

function CountTrendIndicator({ current, previous, type = "positive-is-good" }: { current: number, previous: number, type?: "positive-is-good" | "negative-is-good" }) {
  const diff = current - previous
  
  if (diff === 0) {
    return <span className="flex items-center text-sm text-muted-foreground"><Minus className="w-4 h-4 mr-1" /> No change</span>
  }
  
  const isPositive = diff > 0
  const isGood = type === "positive-is-good" ? isPositive : !isPositive
  const colorClass = isGood ? "text-green-500" : "text-red-500"
  
  return (
    <span className={`flex items-center text-sm ${colorClass}`}>
      {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
      {isPositive ? "+" : ""}{diff} vs last period
    </span>
  )
}

export default async function ManagerTrendsPage(props: { searchParams?: { period?: string } }) {
  const currentUser = await requireManager()
  const searchParams = props.searchParams ? await Promise.resolve(props.searchParams) : {};
  const period = searchParams.period || "this-week"
  
  // Current Period
  let startDate = startOfWeek(new Date(), { weekStartsOn: 1 })
  let endDate = endOfWeek(new Date(), { weekStartsOn: 1 })
  
  // Previous Period
  let prevStartDate = subWeeks(startDate, 1)
  let prevEndDate = subWeeks(endDate, 1)

  if (period === "last-week") {
    startDate = subWeeks(startDate, 1)
    endDate = subWeeks(endDate, 1)
    prevStartDate = subWeeks(startDate, 1)
    prevEndDate = subWeeks(endDate, 1)
  }
  
  const filter = { startDate, endDate }
  const prevFilter = { startDate: prevStartDate, endDate: prevEndDate }

  // Current Metrics
  const timeStats = await getTeamPlannedVsActual(currentUser, filter)
  const taskStats = await getTeamTaskStats(currentUser, filter)
  const attentionTasks = await getOverdueAndBlockedTasks(currentUser, filter)

  // Previous Metrics
  const prevTimeStats = await getTeamPlannedVsActual(currentUser, prevFilter)
  const prevTaskStats = await getTeamTaskStats(currentUser, prevFilter)
  const prevAttentionTasks = await getOverdueAndBlockedTasks(currentUser, prevFilter)

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <a href="/manager/reports" className="flex items-center gap-2 text-sm text-primary hover:underline mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </a>
          <h1 className="text-3xl font-light tracking-tight mb-2 flex items-center gap-2">
            <LineChart className="text-primary w-8 h-8" />
            Performance Trends
          </h1>
          <p className="text-muted-foreground tracking-wide">
            Compare period-over-period operational metrics.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <a 
            href="?period=this-week" 
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${period === 'this-week' ? 'bg-primary text-primary-foreground' : 'bg-white/5 hover:bg-white/10'}`}
          >
            This Week
          </a>
          <a 
            href="?period=last-week" 
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${period === 'last-week' ? 'bg-primary text-primary-foreground' : 'bg-white/5 hover:bg-white/10'}`}
          >
            Last Week
          </a>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* TIME TRENDS */}
        <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-medium border-b border-white/10 pb-4">Time Allocation Trends</h3>
          
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
            <div>
              <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Tracked Time</p>
              <div className="text-3xl font-light">{formatHours(timeStats.actualMinutes)}</div>
            </div>
            <div className="text-right">
              <TrendIndicator current={timeStats.actualMinutes} previous={prevTimeStats.actualMinutes} type="positive-is-good" />
              <p className="text-xs text-muted-foreground mt-1">Prev: {formatHours(prevTimeStats.actualMinutes)}</p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
            <div>
              <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Planned Work</p>
              <div className="text-3xl font-light">{formatHours(timeStats.plannedMinutes)}</div>
            </div>
            <div className="text-right">
              <TrendIndicator current={timeStats.plannedMinutes} previous={prevTimeStats.plannedMinutes} type="positive-is-good" />
              <p className="text-xs text-muted-foreground mt-1">Prev: {formatHours(prevTimeStats.plannedMinutes)}</p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
            <div>
              <p className="text-orange-500/80 text-sm uppercase tracking-wider mb-1">Unplanned Work</p>
              <div className="text-3xl font-light text-orange-500">{formatHours(timeStats.unplannedMinutes)}</div>
            </div>
            <div className="text-right">
              <TrendIndicator current={timeStats.unplannedMinutes} previous={prevTimeStats.unplannedMinutes} type="negative-is-good" />
              <p className="text-xs text-muted-foreground mt-1">Prev: {formatHours(prevTimeStats.unplannedMinutes)}</p>
            </div>
          </div>
        </div>

        {/* TASK TRENDS */}
        <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="text-lg font-medium border-b border-white/10 pb-4">Task & Blockage Trends</h3>
          
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
            <div>
              <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">Completed Tasks</p>
              <div className="text-3xl font-light">{taskStats.completed}</div>
            </div>
            <div className="text-right">
              <CountTrendIndicator current={taskStats.completed} previous={prevTaskStats.completed} type="positive-is-good" />
              <p className="text-xs text-muted-foreground mt-1">Prev: {prevTaskStats.completed}</p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
            <div>
              <p className="text-red-400 text-sm uppercase tracking-wider mb-1">Blocked Tasks</p>
              <div className="text-3xl font-light text-red-500">{attentionTasks.blocked.length}</div>
            </div>
            <div className="text-right">
              <CountTrendIndicator current={attentionTasks.blocked.length} previous={prevAttentionTasks.blocked.length} type="negative-is-good" />
              <p className="text-xs text-muted-foreground mt-1">Prev: {prevAttentionTasks.blocked.length}</p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
            <div>
              <p className="text-orange-400 text-sm uppercase tracking-wider mb-1">Overdue Tasks</p>
              <div className="text-3xl font-light text-orange-500">{attentionTasks.overdue.length}</div>
            </div>
            <div className="text-right">
              <CountTrendIndicator current={attentionTasks.overdue.length} previous={prevAttentionTasks.overdue.length} type="negative-is-good" />
              <p className="text-xs text-muted-foreground mt-1">Prev: {prevAttentionTasks.overdue.length}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
