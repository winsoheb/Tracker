import React from "react"
import { requireManager } from "@/lib/auth-utils"
import { getNoPlanEmployees, getRecurringTaskStats } from "@/lib/reports/engine"
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subWeeks, format } from "date-fns"
import { Activity, ArrowLeft, RefreshCw, UserMinus } from "lucide-react"

export const metadata = {
  title: "Operational Reports | Office Time Tracker",
}

export default async function ManagerOperationalPage(props: { searchParams?: { period?: string } }) {
  const currentUser = await requireManager()
  const searchParams = props.searchParams ? await Promise.resolve(props.searchParams) : {};
  const period = searchParams.period || "this-week"
  
  let startDate = startOfWeek(new Date(), { weekStartsOn: 1 })
  let endDate = endOfWeek(new Date(), { weekStartsOn: 1 })
  
  if (period === "last-week") {
    const lastWeek = subWeeks(new Date(), 1)
    startDate = startOfWeek(lastWeek, { weekStartsOn: 1 })
    endDate = endOfWeek(lastWeek, { weekStartsOn: 1 })
  } else if (period === "today") {
    startDate = startOfDay(new Date())
    endDate = endOfDay(new Date())
  }
  
  const filter = { startDate, endDate }
  
  const noPlanEmployees = await getNoPlanEmployees(currentUser, filter)
  const recurringStats = await getRecurringTaskStats(currentUser, filter)

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <a href="/manager/reports" className="flex items-center gap-2 text-sm text-primary hover:underline mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </a>
          <h1 className="text-3xl font-light tracking-tight mb-2 flex items-center gap-2">
            <Activity className="text-primary w-8 h-8" />
            Operational Reports
          </h1>
          <p className="text-muted-foreground tracking-wide">
            Detailed compliance and plan visibility.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <a 
            href="?period=today" 
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${period === 'today' ? 'bg-primary text-primary-foreground' : 'bg-white/5 hover:bg-white/10'}`}
          >
            Today
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* NO PLAN VISIBILITY */}
        <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-xl lg:col-span-1">
          <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
            <UserMinus className="w-5 h-5 text-orange-400" />
            No Plan Visibility
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Team members with 0 planned tasks for this period.</p>
          
          <div className="space-y-3">
            {noPlanEmployees.length === 0 ? (
              <div className="p-4 bg-white/5 rounded-xl text-sm text-muted-foreground border border-white/5 text-center">
                All team members have planned work!
              </div>
            ) : (
              noPlanEmployees.map(emp => (
                <div key={emp.id} className="p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl flex flex-col">
                  <a href={`/manager/reports/team/${emp.id}`} className="font-medium text-orange-200 hover:underline">
                    {emp.name}
                  </a>
                  <span className="text-xs text-muted-foreground">{emp.email}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RECURRING TASKS */}
        <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-xl lg:col-span-2">
          <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            Recurring Work Compliance
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-3 border-b border-white/10 font-medium text-muted-foreground text-sm">Task Name</th>
                  <th className="p-3 border-b border-white/10 font-medium text-muted-foreground text-sm">Owner</th>
                  <th className="p-3 border-b border-white/10 font-medium text-muted-foreground text-sm text-center">Occurrences</th>
                  <th className="p-3 border-b border-white/10 font-medium text-green-500/80 text-sm text-center">Completed</th>
                  <th className="p-3 border-b border-white/10 font-medium text-muted-foreground text-sm text-center">Skipped</th>
                  <th className="p-3 border-b border-white/10 font-medium text-orange-500/80 text-sm text-center">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {recurringStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">No recurring tasks scheduled for this period.</td>
                  </tr>
                ) : (
                  recurringStats.map((stat, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 text-sm font-medium">{stat.title}</td>
                      <td className="p-3 text-sm text-muted-foreground">{stat.owner}</td>
                      <td className="p-3 text-sm text-center font-mono">{stat.occurrences}</td>
                      <td className="p-3 text-sm text-center font-mono text-green-400">{stat.completed}</td>
                      <td className="p-3 text-sm text-center font-mono">{stat.skipped}</td>
                      <td className="p-3 text-sm text-center font-mono text-orange-400">{stat.overdue}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
