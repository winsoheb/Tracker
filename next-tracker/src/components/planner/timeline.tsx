"use client"

import React, { useState } from "react"
import { DndContext, DragEndEvent, useDraggable, useDroppable, closestCenter } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { motion } from "framer-motion"
import { updateScheduledTaskTime } from "@/lib/actions/planner"
import { addHours, startOfDay, format, parseISO, setHours } from "date-fns"

type Task = any // Typing simplified for now
import { Repeat } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TaskDetailsDialog } from "./task-details-dialog"

function DraggableTask({ task, onClick }: { task: Task, onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: task
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 1,
  }

  const durationStr = `${task.estimatedMinutes}m`

  const isOverdue = task.status !== "COMPLETED" && task.endAt && new Date(task.endAt) < new Date()

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // Prevent click if dragging
        if (!isDragging) onClick()
      }}
      className={`relative p-3 rounded-xl border cursor-grab active:cursor-grabbing backdrop-blur-md shadow-lg transition-colors ${
        isDragging ? 'border-primary bg-primary/20 shadow-primary/20' : 
        task.status === 'IN_PROGRESS' ? 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10' :
        'border-white/10 bg-card hover:bg-white/5'
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          {task.recurrenceId && <Repeat className="w-3 h-3 text-primary/70" />}
          <h4 className={`font-medium text-sm leading-tight ${task.status === 'COMPLETED' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
            {task.title}
          </h4>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isOverdue && (
            <span className="text-[9px] uppercase font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Overdue</span>
          )}
          {task.status === "IN_PROGRESS" && (
            <span className="text-[9px] uppercase font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">In Progress</span>
          )}
          {task.status === "HOLD" && (
            <span className="text-[9px] uppercase font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded" title={task.statusReason || "On Hold"}>On Hold</span>
          )}
          {task.status === "COMPLETED" && (
            <span className="text-[9px] uppercase font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">Done</span>
          )}
          {task.status === "TODO" && !isOverdue && (
            <span className="text-[9px] uppercase font-bold text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">To Do</span>
          )}
          <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">{durationStr}</span>
        </div>
      </div>
      {task.category && (
        <div className="mt-2 text-xs flex items-center gap-1.5 text-primary/80">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: task.category.color || 'var(--color-primary)' }} />
          {task.category.name}
        </div>
      )}
    </div>
  )
}

function DroppableHourSlot({ 
  hour, 
  tasks, 
  date,
  onTaskClick
}: { 
  hour: number, 
  tasks: Task[], 
  date: Date,
  onTaskClick: (t: Task) => void
}) {
  const hourDate = setHours(startOfDay(date), hour)
  
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
    data: { hour, date: hourDate }
  })

  return (
    <div className="flex w-full min-h-[100px] border-b border-white/5 group">
      <div className="w-20 pr-4 py-3 text-right text-xs font-medium text-muted-foreground/60 border-r border-white/5 group-hover:text-primary transition-colors">
        {format(hourDate, "h aa")}
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`flex-1 p-2 flex flex-col gap-2 transition-colors ${isOver ? 'bg-primary/10' : 'hover:bg-white/[0.01]'}`}
      >
        {tasks.map(task => (
          <DraggableTask key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}
      </div>
    </div>
  )
}

export function Timeline({ date, initialTasks }: { date: Date, initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  React.useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  const hours = Array.from({ length: 13 }, (_, i) => i + 8)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    taskId: string
    newStartAt: Date
    newEndAt: Date
  } | null>(null)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && over.data.current) {
      const taskId = active.id as string
      const { hour, date: slotDate } = over.data.current
      
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      const newStartAt = new Date(slotDate)
      const newEndAt = new Date(newStartAt.getTime() + task.estimatedMinutes * 60000)

      if (task.recurrenceId) {
        setConfirmDialog({
          isOpen: true,
          taskId,
          newStartAt,
          newEndAt
        })
        return
      }

      setTasks(current => current.map(t => 
        t.id === taskId ? { ...t, startAt: newStartAt, endAt: newEndAt } : t
      ))

      try {
        await updateScheduledTaskTime(taskId, newStartAt, newEndAt)
      } catch (e) {
        setTasks(initialTasks)
      }
    }
  }

  const handleConfirmRecurringUpdate = async (mode: "THIS_TASK" | "THIS_AND_FUTURE" | "ALL_TASKS") => {
    if (!confirmDialog) return
    const { taskId, newStartAt, newEndAt } = confirmDialog
    setConfirmDialog(null)

    setTasks(current => current.map(t => 
      t.id === taskId ? { ...t, startAt: newStartAt, endAt: newEndAt } : t
    ))

    try {
      await updateScheduledTaskTime(taskId, newStartAt, newEndAt, mode)
    } catch (e) {
      setTasks(initialTasks)
    }
  }

  return (
    <div className="w-full glass rounded-2xl overflow-hidden shadow-2xl">
      <DndContext id="timeline-dnd" onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <div className="flex flex-col">
          {hours.map(hour => {
            const hourTasks = tasks.filter(t => {
              if (!t.startAt) return false
              const taskDate = typeof t.startAt === 'string' ? new Date(t.startAt) : t.startAt
              return taskDate.getHours() === hour
            })
            return (
              <DroppableHourSlot 
                key={hour} 
                hour={hour} 
                tasks={hourTasks} 
                date={date} 
                onTaskClick={setSelectedTask}
              />
            )
          })}
        </div>
      </DndContext>

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

      {/* Recurrence Update Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit recurring task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-4">
            <p className="text-sm text-muted-foreground mb-4">
              You are modifying a recurring task. How would you like to apply this change?
            </p>
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={() => handleConfirmRecurringUpdate("THIS_TASK")}
            >
              This task only
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={() => handleConfirmRecurringUpdate("THIS_AND_FUTURE")}
            >
              This and future tasks
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start h-12"
              onClick={() => handleConfirmRecurringUpdate("ALL_TASKS")}
            >
              Entire series
            </Button>
          </div>
          <div className="pt-2 flex justify-end">
            <Button variant="ghost" onClick={() => setConfirmDialog(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
