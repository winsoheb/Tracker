"use client"

import React, { useState, useEffect } from "react"
import { createScheduledTask } from "@/lib/actions/planner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { RecurrenceSelector, RecurrenceState } from "./recurrence-selector"
import { ReminderSelector } from "./reminder-selector"

export function AddTaskDialog({ 
  date, 
  teamMembers = [], 
  targetUserId 
}: { 
  date: Date, 
  teamMembers?: any[], 
  targetUserId?: string 
}) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const [title, setTitle] = useState("")
  const [minutes, setMinutes] = useState(60)
  const [hour, setHour] = useState(9)
  const [priority, setPriority] = useState("MEDIUM")
  const [assignedUserId, setAssignedUserId] = useState<string | undefined>(targetUserId)
  
  const [recurrence, setRecurrence] = useState<RecurrenceState>({
    frequency: "NONE",
    interval: 1,
    endType: "NEVER"
  })

  const [reminder, setReminder] = useState<number | null>(null)

  useEffect(() => {
    if (open) {
      setAssignedUserId(targetUserId)
    }
  }, [open, targetUserId])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsPending(true)
    try {
      const startAt = new Date(date)
      startAt.setHours(hour, 0, 0, 0)
      const endAt = new Date(startAt.getTime() + minutes * 60000)

      await createScheduledTask({
        title,
        estimatedMinutes: minutes,
        startAt,
        endAt,
        priority: priority,
        assignedUserId: teamMembers.length > 0 ? assignedUserId : undefined,
        recurrence: recurrence.frequency !== "NONE" ? recurrence : undefined,
        reminderMinutes: reminder !== null ? reminder : undefined
      })
      
      setOpen(false)
      setTitle("")
      setMinutes(60)
      setHour(9)
      setPriority("MEDIUM")
      setRecurrence({ frequency: "NONE", interval: 1, endType: "NEVER" })
      setReminder(null)
      setShowMore(false)
    } catch (e: any) {
      alert("Failed to add task: " + e.message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button className="rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:from-primary/90 hover:to-primary transition-all duration-300" />
        }
      >
        <Plus className="w-4 h-4 mr-2" /> Add Task
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-white/10 bg-background/40 backdrop-blur-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-primary/20 blur-[60px] rounded-full pointer-events-none -z-10" />
        
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-tight bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">
            Add Scheduled Task
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-6 pt-4">
          <div className="space-y-2 group">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground group-focus-within:text-primary transition-colors">Task Title</label>
            <Input 
              placeholder="E.g., Deep Work Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              autoFocus
              required
              className="bg-white/5 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl h-12 text-base shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2 group">
              <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground group-focus-within:text-primary transition-colors">Start Time (24h)</label>
              <div className="relative">
                <Input 
                  type="number"
                  min={0}
                  max={23}
                  value={hour}
                  onChange={(e) => setHour(parseInt(e.target.value) || 0)}
                  disabled={isPending}
                  required
                  className="bg-white/5 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl h-12 pl-4 pr-10 text-lg shadow-inner"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-mono text-sm pointer-events-none">:00</span>
              </div>
            </div>
            
            <div className="space-y-2 group">
              <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground group-focus-within:text-primary transition-colors">Duration</label>
              <div className="relative">
                <Input 
                  type="number"
                  min={15}
                  step={15}
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value) || 15)}
                  disabled={isPending}
                  required
                  className="bg-white/5 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl h-12 pl-4 pr-12 text-lg shadow-inner"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 font-medium text-sm pointer-events-none">min</span>
              </div>
            </div>
          </div>

          {teamMembers.length > 0 && (
            <div className="space-y-2 group">
              <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground group-focus-within:text-primary transition-colors">Assign To</label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                disabled={isPending}
                className="w-full bg-white/5 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl h-12 px-4 text-base shadow-inner text-foreground appearance-none cursor-pointer"
              >
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id} className="bg-background text-foreground">
                    {member.name} {member.email ? `(${member.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2 group">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground group-focus-within:text-primary transition-colors">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={isPending}
              className="w-full bg-white/5 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl h-12 px-4 text-base shadow-inner text-foreground appearance-none cursor-pointer"
            >
              <option value="LOW" className="bg-background text-foreground">Low Priority</option>
              <option value="MEDIUM" className="bg-background text-foreground">Medium Priority</option>
              <option value="HIGH" className="bg-background text-foreground">High Priority</option>
              <option value="URGENT" className="bg-background text-foreground">Urgent</option>
            </select>
          </div>

          <RecurrenceSelector 
            taskDate={date}
            value={recurrence}
            onChange={setRecurrence}
          />

          <ReminderSelector 
            value={reminder}
            onChange={setReminder}
          />

          <div className="pt-6 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !title.trim()}
              className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 transition-all duration-300 font-medium text-base"
            >
              {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {!isPending && "Schedule Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
