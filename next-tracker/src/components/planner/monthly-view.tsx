"use client"

import React, { useState } from "react"
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth, isSameDay } from "date-fns"
import { Repeat } from "lucide-react"
import { TaskDetailsDialog } from "./task-details-dialog"

export function MonthlyView({ date, initialTasks }: { date: Date, initialTasks: any[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)

  React.useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const dateFormat = "d"
  const rows = []
  
  let days = []
  let day = startDate
  let formattedDate = ""

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat)
      const cloneDay = day
      
      const dayTasks = tasks.filter(t => t.startAt && isSameDay(new Date(t.startAt), cloneDay))
      
      days.push(
        <div
          key={day.toString()}
          className={`min-h-[100px] border-r border-b border-white/10 p-1 flex flex-col transition-colors ${
            !isSameMonth(day, monthStart)
              ? "bg-white/5 opacity-50"
              : isSameDay(day, new Date())
              ? "bg-primary/10"
              : "hover:bg-white/[0.02]"
          }`}
        >
          <div className="flex justify-end">
            <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              {formattedDate}
            </span>
          </div>
          <div className="flex-1 flex flex-col gap-1 mt-1 overflow-y-auto max-h-[80px] no-scrollbar">
            {dayTasks.map(task => {
              const isOverdue = task.status !== "COMPLETED" && task.endAt && new Date(task.endAt) < new Date()
              return (
              <div 
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-all flex items-center gap-1 ${
                  task.status === 'COMPLETED' ? 'opacity-50 line-through' : 
                  task.status === 'IN_PROGRESS' ? 'ring-1 ring-blue-500/50 hover:opacity-80' : 
                  task.status === 'HOLD' ? 'ring-1 ring-orange-500/50 hover:opacity-80' :
                  'hover:opacity-80'
                }`}
                style={{ 
                  backgroundColor: task.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.1)' : task.status === 'HOLD' ? 'rgba(249, 115, 22, 0.1)' : task.category?.color ? `${task.category.color}30` : 'rgba(255,255,255,0.1)',
                  color: task.status === 'IN_PROGRESS' ? '#60a5fa' : task.status === 'HOLD' ? '#fb923c' : task.category?.color ? task.category.color : 'inherit'
                }}
                title={task.status === 'HOLD' ? task.statusReason || "On Hold" : undefined}
              >
                {isOverdue && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" title="Overdue" />}
                {task.recurrenceId && <Repeat className="w-2.5 h-2.5 shrink-0 opacity-70" />}
                <span className="truncate">{format(new Date(task.startAt), 'HH:mm')} {task.title}</span>
              </div>
            )})}
          </div>
        </div>
      )
      day = addDays(day, 1)
    }
    rows.push(
      <div className="grid grid-cols-7" key={day.toString()}>
        {days}
      </div>
    )
    days = []
  }

  const weekDays = []
  let startDateOfWeek = startOfWeek(monthStart, { weekStartsOn: 1 })
  for (let i = 0; i < 7; i++) {
    weekDays.push(
      <div key={i} className="text-center py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-r border-b border-white/10 last:border-r-0">
        {format(addDays(startDateOfWeek, i), "EEE")}
      </div>
    )
  }

  return (
    <div className="w-full glass rounded-2xl overflow-hidden shadow-2xl bg-black/20">
      <div className="grid grid-cols-7 bg-white/5">
        {weekDays}
      </div>
      <div className="flex flex-col border-l border-t border-white/10 -ml-[1px] -mt-[1px]">
        {rows}
      </div>

      {selectedTask && (
        <TaskDetailsDialog 
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onDeleted={() => {
            setTasks(current => current.filter(t => t.id !== selectedTask.id))
            setSelectedTask(null)
          }}
          onUpdated={(updatedTask) => {
            setTasks(current => current.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
            setSelectedTask(null)
          }}
        />
      )}
    </div>
  )
}
