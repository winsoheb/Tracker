import React from "react"
import { requireManager, canManageUser } from "@/lib/auth-utils"
import { getTeamPlannedVsActual, getTeamTaskStats } from "@/lib/reports/engine"
import { startOfWeek, endOfWeek, subWeeks } from "date-fns"
import { BarChart3, Clock, CalendarDays, AlertTriangle, CheckCircle2, User } from "lucide-react"
import { prisma } from "@/lib/prisma"

export const metadata = {
  title: "Employee Report | Office Time Tracker",
}

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default async function EmployeeReportPage(
  props: { params: { userId: string }, searchParams?: { period?: string } }
) {
  const currentUser = await requireManager()
  const params = await Promise.resolve(props.params);
  const searchParams = props.searchParams ? await Promise.resolve(props.searchParams) : {};
  const targetUserId = params.userId

  // Enforce Authorization
  const isAuthorized = await canManageUser(currentUser, targetUserId)
  if (!isAuthorized && currentUser.role !== "ADMIN") {
    return <div className="p-8 text-center text-red-500">Unauthorized to view this employee.</div>
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { name: true, email: true }
  })

  if (!targetUser) return <div className="p-8">User not found</div>

  const period = searchParams.period || "this-week"
  let startDate = startOfWeek(new Date(), { weekStartsOn: 1 })
  let endDate = endOfWeek(new Date(), { weekStartsOn: 1 })
  
  if (period === "last-week") {
    const lastWeek = subWeeks(new Date(), 1)
    startDate = startOfWeek(lastWeek, { weekStartsOn: 1 })
    endDate = endOfWeek(lastWeek, { weekStartsOn: 1 })
  }
  
  const filter = { startDate, endDate, userId: targetUserId }

  const timeStats = await getTeamPlannedVsActual(currentUser, filter)
  const taskStats = await getTeamTaskStats(currentUser, filter)

  // Time Distribution (Category Breakdown)
  const timeEntries = await prisma.timeEntry.findMany({
    where: { userId: targetUserId, startedAt: { gte: filter.startDate, lte: filter.endDate } },
    include: { category: { select: { name: true } } }
  })

  const categoryMap: Record<string, number> = {}
  for (const entry of timeEntries) {
    const catName = entry.category?.name || "Uncategorized"
    categoryMap[catName] = (categoryMap[catName] || 0) + entry.duration
  }
  const categoryDistribution = Object.entries(categoryMap)
    .map(([name, duration]) => ({ name, duration: Math.round(duration / 60) }))
    .sort((a, b) => b.duration - a.duration)

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2 flex items-center gap-2">
            <User className="text-primary w-8 h-8" />
            {targetUser.name}'s Report
          </h1>
          <p className="text-muted-foreground tracking-wide">
            {targetUser.email}
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

      {/* CORE METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CalendarDays className="w-16 h-16" />
          </div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">Planned</h3>
          <div className="text-4xl font-light">{formatHours(timeStats.plannedMinutes)}</div>
        </div>

        <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="w-16 h-16" />
          </div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">Tracked</h3>
          <div className="text-4xl font-light">{formatHours(timeStats.actualMinutes)}</div>
        </div>
        
        <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">Completed</h3>
          <div className="text-4xl font-light">{taskStats.completed} <span className="text-lg text-muted-foreground">tasks</span></div>
        </div>

        <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden border-orange-500/20">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-orange-500">
            <AlertTriangle className="w-16 h-16" />
          </div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-orange-500/80 mb-1">Unplanned</h3>
          <div className="text-4xl font-light text-orange-500">{formatHours(timeStats.unplannedMinutes)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-medium mb-6">Task Status</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-mono text-lg">{taskStats.completed}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-muted-foreground">In Progress</span>
              <span className="font-mono text-lg">{taskStats.inProgress}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-red-400">Blocked</span>
              <span className="font-mono text-lg text-red-400">{taskStats.blocked}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <span className="text-orange-400">Overdue</span>
              <span className="font-mono text-lg text-orange-400">{taskStats.overdue}</span>
            </div>
          </div>
        </div>

        <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-medium mb-6">Time Distribution</h3>
          <div className="space-y-4">
            {categoryDistribution.length === 0 ? (
              <p className="text-muted-foreground text-sm">No time tracked during this period.</p>
            ) : (
              categoryDistribution.map(cat => (
                <div key={cat.name} className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-muted-foreground">{cat.name}</span>
                  <span className="font-mono text-lg">{formatHours(cat.duration)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
