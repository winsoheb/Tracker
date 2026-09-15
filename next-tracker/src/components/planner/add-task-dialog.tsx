"use client"

import React, { useState } from "react"
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
import { Plus, Loader2 } from "lucide-react"

export function AddTaskDialog({ date }: { date: Date }) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [title, setTitle] = useState("")
  const [minutes, setMinutes] = useState(60)
  const [hour, setHour] = useState(9) // default 9 AM

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsPending(true)
    try {
      // Construct start/end dates
      const startAt = new Date(date)
      startAt.setHours(hour, 0, 0, 0)
      
      const endAt = new Date(startAt.getTime() + minutes * 60000)

      await createScheduledTask({
        title,
        estimatedMinutes: minutes,
        startAt,
        endAt,
      })
      setOpen(false)
      setTitle("")
      setMinutes(60)
      setHour(9)
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
          <Button className="rounded-xl shadow-lg shadow-primary/20" />
        }
      >
        <Plus className="w-4 h-4 mr-2" /> Add Task
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Scheduled Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Task Title</label>
            <Input 
              placeholder="E.g., Review PRs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Start Time (24h)</label>
              <Input 
                type="number"
                min={0}
                max={23}
                value={hour}
                onChange={(e) => setHour(parseInt(e.target.value) || 0)}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Duration (mins)</label>
              <Input 
                type="number"
                min={15}
                step={15}
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 15)}
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
