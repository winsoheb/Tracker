import React from "react"
import { requireManager } from "@/lib/auth-utils"
import { getTeamPlannedVsActual, getTeamTaskStats, getTeamWorkloadSummary, getOverdueAndBlockedTasks, getTeamProjectStats } from "@/lib/reports/engine"
import { startOfWeek, endOfWeek, subWeeks } from "date-fns"
import { BarChart3, Clock, CalendarDays, AlertTriangle, CheckCircle2, Activity, Download } from "lucide-react"

export const metadata = {
  title: "Team Reports | Office Time Tracker",
}

function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export default async function ManagerReportsPage(props: { searchParams?: { period?: string } }) {
  const currentUser = await requireManager()
  
  const searchParams = props.searchParams ? await Promise.resolve(props.searchParams) : {};
  const period = searchParams.period || "this-week"
  
  let startDate = startOfWeek(new Date(), { weekStartsOn: 1 })
  let endDate = endOfWeek(new Date(), { weekStartsOn: 1 })
  
  if (period === "last-week") {
    const lastWeek = subWeeks(new Date(), 1)
    startDate = startOfWeek(lastWeek, { weekStartsOn: 1 })
    endDate = endOfWeek(lastWeek, { weekStartsOn: 1 })
  }
  
  const filter = { startDate, endDate }

  const timeStats = await getTeamPlannedVsActual(currentUser, filter)
  const taskStats = await getTeamTaskStats(currentUser, filter)
  const teamWorkload = await getTeamWorkloadSummary(currentUser, filter)
  const attentionTasks = await getOverdueAndBlockedTasks(currentUser, filter)
  const projectStats = await getTeamProjectStats(currentUser, filter)

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2 flex items-center gap-2">
            <BarChart3 className="text-primary w-8 h-8" />
            Team Analytics
          </h1>
          <p className="text-muted-foreground tracking-wide">
            Operational visibility for your team.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <a 
            href={`/api/reports/export?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`} 
            className="px-4 py-2 rounded-lg text-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex items-center gap-2 mr-2"
            download
          >
            <Download className="w-4 h-4" /> Export
          </a>
          <a 
            href="/manager/reports/operational" 
            className="px-4 py-2 rounded-lg text-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex items-center gap-2"
          >
            <Activity className="w-4 h-4" /> Operations
          </a>
          <a 
            href="/manager/reports/trends" 
            className="px-4 py-2 rounded-lg text-sm bg-white/5 hover:bg-white/10 transition-colors border border-white/10 mr-4 flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" /> View Trends
          </a>
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
        {/* TASK STATUS SUMMARY */}
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
            <div className="flex justify-between items-center pt-2">
              <span className="text-muted-foreground font-semibold">Total Active Tasks</span>
              <span className="font-mono text-xl">{taskStats.total}</span>
            </div>
          </div>
        </div>

        {/* PROJECTS SUMMARY */}
        <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-xl lg:col-span-2">
          <h3 className="text-lg font-medium mb-6">Top Projects</h3>
          <div className="space-y-4">
            {projectStats.length === 0 ? (
              <p className="text-muted-foreground text-sm">No project time tracked.</p>
            ) : (
              projectStats.slice(0, 5).map(proj => (
                <div key={proj.id} className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{proj.name}</span>
                    {proj.status !== "ACTIVE" && <span className="text-xs text-muted-foreground">{proj.status}</span>}
                  </div>
                  <span className="font-mono text-lg">{formatHours(proj.durationMinutes)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TEAM WORKLOAD */}
        <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Team Workload & Capacity</h3>
            <a href="/manager/reports/workload" className="text-sm text-primary hover:underline">View Timeline</a>
          </div>
          <div className="space-y-4">
            {teamWorkload.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active team members.</p>
            ) : (
              teamWorkload.map(member => {
                const capacityPercent = member.availableCapacityMinutes > 0 ? Math.min(100, Math.round((member.plannedMinutes / member.availableCapacityMinutes) * 100)) : 0
                return (
                  <div key={member.id} className="flex flex-col p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <a href={`/manager/reports/team/${member.id}`} className="font-medium hover:underline hover:text-primary transition-colors">{member.name}</a>
                        <p className="text-xs text-muted-foreground">{member.openTasks} open tasks</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono">{formatHours(member.plannedMinutes)} / {formatHours(member.availableCapacityMinutes)}</div>
                        <p className={`text-xs ${capacityPercent > 100 ? 'text-red-400' : 'text-muted-foreground'}`}>{capacityPercent}% Planned</p>
                      </div>
                    </div>
                    {/* Visual Capacity Bar */}
                    <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden mt-2 relative">
                      <div 
                        className={`absolute top-0 left-0 h-full rounded-full ${capacityPercent > 100 ? 'bg-red-500' : (capacityPercent > 80 ? 'bg-orange-500' : 'bg-primary')}`}
                        style={{ width: `${Math.min(100, capacityPercent)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* BLOCKED & OVERDUE */}
        <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-xl lg:col-span-2 border-red-500/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> 
              Attention Required
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Blocked Work ({attentionTasks.blocked.length})</h4>
              <div className="space-y-3">
                {attentionTasks.blocked.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No blocked tasks.</p>
                ) : (
                  attentionTasks.blocked.slice(0, 5).map(task => (
                    <div key={task.id} className="p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                      <div className="font-medium text-sm text-red-200">{task.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                        <span>{task.user.name}</span>
                        <span>{task.project?.name || "No Project"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Overdue Tasks ({attentionTasks.overdue.length})</h4>
              <div className="space-y-3">
                {attentionTasks.overdue.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No overdue tasks.</p>
                ) : (
                  attentionTasks.overdue.slice(0, 5).map(task => (
                    <div key={task.id} className="p-3 bg-orange-500/5 rounded-xl border border-orange-500/10">
                      <div className="font-medium text-sm text-orange-200">{task.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                        <span>{task.user.name}</span>
                        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
