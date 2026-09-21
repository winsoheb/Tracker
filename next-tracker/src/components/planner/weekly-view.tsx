"use client"

import React, { useState } from "react"
import { startOfWeek, addDays, format, isSameDay } from "date-fns"
import { Repeat } from "lucide-react"
import { TaskDetailsDialog } from "./task-details-dialog"

export function WeeklyView({ date, initialTasks }: { date: Date, initialTasks: any[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)

  React.useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="w-full glass rounded-2xl overflow-hidden shadow-2xl bg-black/20">
      <div className="grid grid-cols-7 border-b border-white/10">
        {days.map((day, i) => (
          <div key={i} className="text-center py-3 px-1 border-r border-white/10 last:border-0 bg-white/5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{format(day, 'EEE')}</div>
            <div className={`text-xl font-light mt-1 ${isSameDay(day, new Date()) ? 'text-primary' : 'text-foreground'}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 min-h-[500px]">
        {days.map((day, i) => {
          const dayTasks = tasks.filter(t => t.startAt && isSameDay(new Date(t.startAt), day))
          return (
            <div key={i} className="border-r border-white/10 last:border-0 p-2 space-y-2">
              {dayTasks.map(task => {
                const isOverdue = task.status !== "COMPLETED" && task.endAt && new Date(task.endAt) < new Date()
                return (
                <div 
                  key={task.id} 
                  onClick={() => setSelectedTask(task)}
                  className={`p-2.5 rounded-xl border cursor-pointer shadow-sm transition-all text-left ${
                    task.status === 'COMPLETED' ? 'opacity-50 border-white/10' : 
                    task.status === 'IN_PROGRESS' ? 'border-blue-500/50 hover:border-blue-400' :
                    'border-white/10 hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-md'
                  }`}
                  style={{ backgroundColor: task.status === 'IN_PROGRESS' ? 'rgba(59, 130, 246, 0.1)' : task.category?.color ? `${task.category.color}20` : 'rgba(255,255,255,0.02)' }}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      {task.recurrenceId && <Repeat className="w-3 h-3 text-primary/70 shrink-0" />}
                      <span className={`text-xs font-medium leading-tight ${task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      {isOverdue && <span className="uppercase font-bold text-red-400">Overdue</span>}
                      {task.status === "IN_PROGRESS" && <span className="uppercase font-bold text-blue-400">In Progress</span>}
                      {task.status === "HOLD" && <span className="uppercase font-bold text-orange-400" title={task.statusReason || "On Hold"}>On Hold</span>}
                      {task.status === "COMPLETED" && <span className="uppercase font-bold text-green-400">Done</span>}
                      <span>{format(new Date(task.startAt), 'h:mm a')}</span>
                    </div>
                    <span className="font-mono bg-black/20 px-1 rounded">{task.estimatedMinutes}m</span>
                  </div>
                </div>
              )})}
            </div>
          )
        })}
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
