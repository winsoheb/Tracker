import React from "react"
import { requireManager } from "@/lib/auth-utils"
import { getTeamWorkloadTimeline } from "@/lib/reports/engine"
import { startOfWeek, endOfWeek, subWeeks, addDays, format } from "date-fns"
import { CalendarDays, ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Team Workload Timeline | Office Time Tracker",
}

export default async function ManagerWorkloadPage(props: { searchParams?: { period?: string } }) {
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
  const { users, timeline } = await getTeamWorkloadTimeline(currentUser, filter)

  // Generate an array of 5 working days (Mon-Fri) based on startDate
  const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(startDate, i))

  function getIntensityClass(minutes: number) {
    if (minutes === 0) return "bg-white/5" // None
    if (minutes < 240) return "bg-primary/40" // Light (<4 hours)
    if (minutes <= 480) return "bg-primary" // Normal (4-8 hours)
    return "bg-red-500" // Overallocated (>8 hours)
  }

  function formatHours(minutes: number) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <a href="/manager/reports" className="flex items-center gap-2 text-sm text-primary hover:underline mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </a>
          <h1 className="text-3xl font-light tracking-tight mb-2 flex items-center gap-2">
            <CalendarDays className="text-primary w-8 h-8" />
            Workload Timeline
          </h1>
          <p className="text-muted-foreground tracking-wide">
            Visual capacity matrix for the week.
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

      <div className="bg-background/40 backdrop-blur-3xl border border-white/5 rounded-2xl p-6 shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="p-4 border-b border-white/10 font-medium text-muted-foreground w-1/4">Team Member</th>
              {weekDays.map(day => (
                <th key={day.toISOString()} className="p-4 border-b border-white/10 text-center font-medium">
                  <div className="text-xs text-muted-foreground uppercase">{format(day, 'EEE')}</div>
                  <div className="text-lg">{format(day, 'dd')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">No team members found.</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <a href={`/manager/reports/team/${user.id}`} className="font-medium hover:underline hover:text-primary transition-colors">
                      {user.name}
                    </a>
                  </td>
                  {weekDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const minutes = timeline[user.id]?.[dateStr] || 0
                    
                    return (
                      <td key={dateStr} className="p-4 text-center">
                        <div 
                          className={`w-full max-w-[80px] mx-auto h-8 rounded-md flex items-center justify-center text-xs font-mono transition-colors ${getIntensityClass(minutes)}`}
                          title={`${formatHours(minutes)} planned`}
                        >
                          {minutes > 0 ? formatHours(minutes) : '-'}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Legend */}
        <div className="mt-8 flex gap-6 items-center justify-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white/5 border border-white/10"></div> No Plan
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/40"></div> Light Workload
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary"></div> Optimal (4-8h)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div> Overallocated
          </div>
        </div>
      </div>
    </div>
  )
}
