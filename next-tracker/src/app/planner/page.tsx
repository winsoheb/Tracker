import React from "react"
import { getScheduledTasks } from "@/lib/actions/planner"
import { Timeline } from "@/components/planner/timeline"
import { AddTaskDialog } from "@/components/planner/add-task-dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Opt out of caching since this is real-time
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function PlannerPage(props: { searchParams?: { date?: string } }) {
  // Parse search params correctly for Next.js app router
  const searchParams = props.searchParams ? await Promise.resolve(props.searchParams) : {};
  
  const selectedDate = searchParams.date ? new Date(searchParams.date) : new Date()
  const tasks = await getScheduledTasks(selectedDate)

  // Calculate prev/next dates for navigation
  const prevDate = new Date(selectedDate)
  prevDate.setDate(selectedDate.getDate() - 1)
  const nextDate = new Date(selectedDate)
  nextDate.setDate(selectedDate.getDate() + 1)

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto py-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light tracking-tight mb-2">
            Planner
          </h1>
          <p className="text-muted-foreground tracking-wide">
            Schedule your deep work and manage time blocks.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center glass rounded-xl p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary">
              <a href={`/planner?date=${prevDate.toISOString()}`}>
                <ChevronLeft className="w-4 h-4" />
              </a>
            </Button>
            <div className="px-4 font-medium text-sm w-32 text-center">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary">
              <a href={`/planner?date=${nextDate.toISOString()}`}>
                <ChevronRight className="w-4 h-4" />
              </a>
            </Button>
          </div>
          <AddTaskDialog date={selectedDate} />
        </div>
      </header>

      <div className="flex-1">
        <Timeline date={selectedDate} initialTasks={tasks} />
      </div>
    </div>
  )
}
