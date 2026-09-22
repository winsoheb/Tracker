"use client"

import { useState } from "react"
import { User, Clock, AlertCircle } from "lucide-react"

const BUCKETS = [
  { id: "BACKLOG", label: "Backlog" },
  { id: "UP_NEXT", label: "Up next" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "BLOCKED", label: "Blocked" },
  { id: "COMPLETED", label: "Completed" }
]

export function BoardView({ tasks }: { tasks: any[] }) {
  const [localTasks, setLocalTasks] = useState(tasks)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    if (!draggedTaskId) return

    const task = localTasks.find(t => t.id === draggedTaskId)
    if (!task || task.status === targetStatus) {
      setDraggedTaskId(null)
      return
    }

    // Optimistic update
    setLocalTasks(prev => 
      prev.map(t => t.id === draggedTaskId ? { ...t, status: targetStatus } : t)
    )
    
    setDraggedTaskId(null)

    try {
      await updateScheduledTaskStatus(draggedTaskId, targetStatus)
    } catch (error) {
      console.error("Failed to move task", error)
      // Revert on failure
      setLocalTasks(tasks)
    }
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-8 snap-x min-h-[600px]">
      {BUCKETS.map(bucket => {
        const bucketTasks = localTasks.filter(t => 
          t.status === bucket.id || (bucket.id === "UP_NEXT" && t.status === "TODO")
        )

        return (
          <div 
            key={bucket.id} 
            className="flex-shrink-0 w-80 flex flex-col gap-4 snap-start"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, bucket.id)}
          >
            <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
              <h3 className="text-lg">{bucket.label}</h3>
              <span className="text-sm font-normal text-muted-foreground">{bucketTasks.length}</span>
            </div>

            <div className="flex flex-col gap-3 min-h-[200px] bg-slate-100/50 dark:bg-slate-800/30 rounded-xl p-2">
              {bucketTasks.map(task => (
                <div 
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className={`bg-white dark:bg-slate-900 rounded-xl p-4 cursor-grab active:cursor-grabbing border-l-4 hover:shadow-md transition-shadow ${
                    task.priority === "HIGH" || task.priority === "URGENT" ? "border-l-red-500" : "border-l-primary"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="font-medium text-sm leading-tight text-slate-900 dark:text-slate-100">
                        {task.title}
                      </p>
                      
                      {task.project && (
                        <p className="text-xs text-muted-foreground truncate">
                          {task.project.name}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          {task.estimatedMinutes && (
                            <span className="bg-secondary text-secondary-foreground text-[10px] px-1.5 py-0.5 rounded-sm font-normal inline-flex items-center">
                              {task.estimatedMinutes}m
                            </span>
                          )}
                          {task.status === "BLOCKED" && (
                            <AlertCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                            <User className="w-3 h-3 text-slate-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {bucketTasks.length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-center text-sm text-muted-foreground">
                  Drop here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
