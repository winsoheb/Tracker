import React from "react"
import { getScheduledTasks } from "@/lib/actions/planner"
import { Timeline } from "@/components/planner/timeline"
import { WeeklyView } from "@/components/planner/weekly-view"
import { MonthlyView } from "@/components/planner/monthly-view"
import { AddTaskDialog } from "@/components/planner/add-task-dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, LayoutGrid } from "lucide-react"
import { requireAuth, getAllowedTeamMembers } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays } from "date-fns"

import { UserSelector } from "@/components/planner/user-selector"

// Opt out of caching since this is real-time
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PlannerPage(props: { searchParams?: { date?: string, user?: string, view?: string } }) {
  const currentUser = await requireAuth()
  
  const searchParams = props.searchParams ? await Promise.resolve(props.searchParams) : {};
  
  const selectedDate = searchParams.date ? new Date(searchParams.date) : new Date()
  const view = searchParams.view || "daily"
  const targetUserId = searchParams.user || currentUser.id
  
  let startDate = selectedDate
  let endDate = selectedDate

  if (view === "weekly") {
    startDate = startOfWeek(selectedDate, { weekStartsOn: 1 })
    endDate = endOfWeek(selectedDate, { weekStartsOn: 1 })
  } else if (view === "monthly") {
    startDate = subDays(startOfMonth(selectedDate), 7) // Pad for grid
    endDate = addDays(endOfMonth(selectedDate), 7)
  }

  let tasks = []
  try {
    tasks = await getScheduledTasks(startDate, endDate, targetUserId)
  } catch (e: any) {
    if (e.message.includes("Forbidden")) {
      redirect("/planner")
    }
    throw e
  }

  let teamMembers: any[] = []
  if (currentUser.role === "MANAGER" || currentUser.role === "ADMIN") {
    const allowedIds = await getAllowedTeamMembers(currentUser)
    
    // Explicitly add the manager themselves to the allowed list so the dropdown syncs correctly
    if (!allowedIds.includes(currentUser.id)) {
      allowedIds.unshift(currentUser.id)
    }

    if (allowedIds.length > 0) {
      teamMembers = await prisma.user.findMany({
        where: { id: { in: allowedIds } },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' }
      })
      
      // Ensure current user is at the top of the list
      const currentUserIndex = teamMembers.findIndex(m => m.id === currentUser.id)
      if (currentUserIndex > 0) {
        const self = teamMembers.splice(currentUserIndex, 1)[0]
        teamMembers.unshift(self)
      }
    }
  }

  const getNavDates = () => {
    const prev = new Date(selectedDate)
    const next = new Date(selectedDate)
    if (view === "daily") {
      prev.setDate(prev.getDate() - 1)
      next.setDate(next.getDate() + 1)
    } else if (view === "weekly") {
      prev.setDate(prev.getDate() - 7)
      next.setDate(next.getDate() + 7)
    } else if (view === "monthly") {
      prev.setMonth(prev.getMonth() - 1)
      next.setMonth(next.getMonth() + 1)
    }
    return { prev, next }
  }

  const { prev: prevDate, next: nextDate } = getNavDates()
  
  const queryParams = new URLSearchParams()
  if (searchParams.user) queryParams.set("user", searchParams.user)
  if (view !== "daily") queryParams.set("view", view)
  const baseQuery = queryParams.toString() ? `&${queryParams.toString()}` : ""

  const dateLabel = () => {
    if (view === "daily") return selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (view === "weekly") return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto py-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2">
            Planner
          </h1>
          <p className="text-muted-foreground tracking-wide">
            Schedule your deep work and manage time blocks.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center glass rounded-xl p-1 bg-white/5">
            <a href={`/planner?date=${selectedDate.toISOString()}&view=daily${searchParams.user ? `&user=${searchParams.user}` : ''}`} className={`p-2 rounded-lg transition-colors ${view === 'daily' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/10'}`}>
              <CalendarDays className="w-4 h-4" />
            </a>
            <a href={`/planner?date=${selectedDate.toISOString()}&view=weekly${searchParams.user ? `&user=${searchParams.user}` : ''}`} className={`p-2 rounded-lg transition-colors ${view === 'weekly' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/10'}`}>
              <LayoutGrid className="w-4 h-4" />
            </a>
            <a href={`/planner?date=${selectedDate.toISOString()}&view=monthly${searchParams.user ? `&user=${searchParams.user}` : ''}`} className={`p-2 rounded-lg transition-colors ${view === 'monthly' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/10'}`}>
              <Calendar className="w-4 h-4" />
            </a>
          </div>

          <UserSelector 
            teamMembers={teamMembers} 
            targetUserId={targetUserId} 
            currentDateStr={searchParams.date || ''} 
            currentViewStr={view}
          />
          
          <div className="flex items-center glass rounded-xl p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary">
              <a href={`/planner?date=${prevDate.toISOString()}${baseQuery.replace(`&view=${view}`, '')}&view=${view}`}>
                <ChevronLeft className="w-4 h-4" />
              </a>
            </Button>
            <div className="px-4 font-medium text-sm text-center whitespace-nowrap min-w-[120px]">
              {dateLabel()}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary">
              <a href={`/planner?date=${nextDate.toISOString()}${baseQuery.replace(`&view=${view}`, '')}&view=${view}`}>
                <ChevronRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
          <AddTaskDialog date={selectedDate} teamMembers={teamMembers} targetUserId={targetUserId} />
        </div>
      </header>

      <div className="flex-1">
        {view === "daily" && <Timeline key={`daily-${targetUserId}-${selectedDate.toISOString()}`} date={selectedDate} initialTasks={tasks} />}
        {view === "weekly" && <WeeklyView key={`weekly-${targetUserId}-${selectedDate.toISOString()}`} date={selectedDate} initialTasks={tasks} />}
        {view === "monthly" && <MonthlyView key={`monthly-${targetUserId}-${selectedDate.toISOString()}`} date={selectedDate} initialTasks={tasks} />}
      </div>
    </div>
  )
}
