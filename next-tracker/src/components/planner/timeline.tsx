"use client"

import React, { useState } from "react"
import { DndContext, DragEndEvent, useDraggable, useDroppable, closestCenter } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { motion } from "framer-motion"
import { updateScheduledTaskTime } from "@/lib/actions/planner"
import { addHours, startOfDay, format, parseISO, setHours } from "date-fns"

type Task = any // Typing simplified for now

function DraggableTask({ task }: { task: Task }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative p-3 rounded-xl border cursor-grab active:cursor-grabbing backdrop-blur-md shadow-lg transition-colors ${isDragging ? 'border-primary bg-primary/20 shadow-primary/20' : 'border-white/10 bg-card hover:bg-white/5'}`}
    >
      <div className="flex justify-between items-start gap-2">
        <h4 className="font-medium text-sm text-foreground leading-tight">{task.title}</h4>
        <span className="text-[10px] font-mono text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">{durationStr}</span>
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

function DroppableHourSlot({ hour, tasks, date }: { hour: number, tasks: Task[], date: Date }) {
  const hourDate = setHours(startOfDay(date), hour)
  
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
    data: { hour, date: hourDate }
  })

  return (
    <div className="flex w-full min-h-[100px] border-b border-white/5 group">
      {/* Time Label */}
      <div className="w-20 pr-4 py-3 text-right text-xs font-medium text-muted-foreground/60 border-r border-white/5 group-hover:text-primary transition-colors">
        {format(hourDate, "h aa")}
      </div>
      
      {/* Droppable Area */}
      <div 
        ref={setNodeRef} 
        className={`flex-1 p-2 flex flex-col gap-2 transition-colors ${isOver ? 'bg-primary/10' : 'hover:bg-white/[0.01]'}`}
      >
        {tasks.map(task => (
          <DraggableTask key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}

export function Timeline({ date, initialTasks }: { date: Date, initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  
  // Sync when server data changes (e.g. after adding a task)
  React.useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  // Create hours array (e.g., 8am to 8pm)
  const hours = Array.from({ length: 13 }, (_, i) => i + 8)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && over.data.current) {
      const taskId = active.id as string
      const { hour, date: slotDate } = over.data.current
      
      const task = tasks.find(t => t.id === taskId)
      if (!task) return

      // Optimistic update
      const newStartAt = new Date(slotDate)
      const newEndAt = new Date(newStartAt.getTime() + task.estimatedMinutes * 60000)

      setTasks(current => current.map(t => 
        t.id === taskId ? { ...t, startAt: newStartAt, endAt: newEndAt } : t
      ))

      // Server update
      try {
        await updateScheduledTaskTime(taskId, newStartAt, newEndAt)
      } catch (e) {
        // Revert on error
        setTasks(initialTasks)
      }
    }
  }

  return (
    <div className="w-full glass rounded-2xl overflow-hidden shadow-2xl">
      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <div className="flex flex-col">
          {hours.map(hour => {
            const hourTasks = tasks.filter(t => {
              const taskDate = typeof t.startAt === 'string' ? new Date(t.startAt) : t.startAt
              return taskDate.getHours() === hour
            })
            return (
              <DroppableHourSlot 
                key={hour} 
                hour={hour} 
                tasks={hourTasks} 
                date={date} 
              />
            )
          })}
        </div>
      </DndContext>
    </div>
  )
}
