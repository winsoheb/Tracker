"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Play, CheckCircle, Trash2, Loader2, Repeat } from "lucide-react"
import { deleteScheduledTask, updateScheduledTaskStatus } from "@/lib/actions/planner"
import { format } from "date-fns"

import { startTimer } from "@/lib/actions/timer"

export function TaskDetailsDialog({ 
  task, 
  isOpen, 
  onClose,
  onDeleted,
  onUpdated
}: { 
  task: any
  isOpen: boolean
  onClose: () => void
  onDeleted: () => void
  onUpdated?: (updatedTask: any) => void
}) {
  const [isPending, setIsPending] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  
  const [showHoldInput, setShowHoldInput] = useState(task.status === "HOLD")
  const [holdReason, setHoldReason] = useState(task.statusReason || "")

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    setIsPending(true)
    try {
      const updated = await updateScheduledTaskStatus(task.id, newStatus, reason)
      if (newStatus === "IN_PROGRESS") {
        window.dispatchEvent(new Event("timer_updated"))
      }
      if (onUpdated && updated) {
        onUpdated(updated)
      } else {
        onClose()
      }
    } catch (e: any) {
      alert("Error: " + e.message)
    } finally {
      setIsPending(false)
    }
  }

  const handleStartTimer = () => {
    setShowHoldInput(false)
    handleStatusChange("IN_PROGRESS")
  }
  const handleComplete = () => {
    setShowHoldInput(false)
    handleStatusChange("COMPLETED")
  }

  const handleDelete = async (mode: "THIS_TASK" | "THIS_AND_FUTURE" | "ALL_TASKS" = "THIS_TASK") => {
    setIsPending(true)
    try {
      await deleteScheduledTask(task.id, mode)
      onDeleted()
      onClose()
    } catch (e: any) {
      alert("Error: " + e.message)
    } finally {
      setIsPending(false)
    }
  }

  if (!task) return null

  const isRecurring = !!task.recurrenceId

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] border-white/10 bg-background/95 backdrop-blur-3xl shadow-2xl rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isRecurring && <Repeat className="w-4 h-4 text-primary" />}
            <DialogTitle className="text-xl">{task.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2 sm:col-span-1">
              <span className="text-muted-foreground">Status:</span>
              <div className="mt-1">
                <select
                  value={showHoldInput ? "HOLD" : task.status}
                  onChange={(e) => {
                    if (e.target.value === "HOLD") {
                      setShowHoldInput(true)
                    } else {
                      setShowHoldInput(false)
                      handleStatusChange(e.target.value)
                    }
                  }}
                  disabled={isPending}
                  className="bg-white/5 border border-white/10 rounded-lg h-8 px-2 text-sm focus:ring-primary/50 text-foreground cursor-pointer appearance-none w-full"
                >
                  <option value="TODO" className="bg-background text-foreground">To Do</option>
                  <option value="IN_PROGRESS" className="bg-background text-foreground">In Progress</option>
                  <option value="HOLD" className="bg-background text-foreground">On Hold</option>
                  <option value="COMPLETED" className="bg-background text-foreground">Completed</option>
                </select>
              </div>
              
              {showHoldInput && (
                <div className="mt-3 flex flex-col gap-2">
                  <textarea 
                    placeholder="Reason for putting on hold..."
                    value={holdReason}
                    onChange={(e) => setHoldReason(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg p-2 text-xs focus:ring-primary/50 text-foreground w-full resize-none h-16"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleStatusChange("HOLD", holdReason)} disabled={isPending || !holdReason.trim()}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setShowHoldInput(task.status === "HOLD")
                      setHoldReason(task.statusReason || "")
                    }} disabled={isPending}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Priority:</span>
              <div className="font-medium mt-1">{task.priority}</div>
            </div>
            {task.category && (
              <div>
                <span className="text-muted-foreground">Category:</span>
                <div className="font-medium mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.category.color || 'gray' }} />
                  {task.category.name}
                </div>
              </div>
            )}
            {task.project && (
              <div>
                <span className="text-muted-foreground">Project:</span>
                <div className="font-medium mt-1">{task.project.name}</div>
              </div>
            )}
            {task.reminders && task.reminders.length > 0 && (
              <div>
                <span className="text-muted-foreground">Reminder:</span>
                <div className="font-medium mt-1">
                  {task.reminders[0].minutesBefore === 0 ? "At start time" :
                   task.reminders[0].minutesBefore < 60 ? `${task.reminders[0].minutesBefore} minutes before` :
                   task.reminders[0].minutesBefore < 1440 ? `${task.reminders[0].minutesBefore / 60} hours before` :
                   `${task.reminders[0].minutesBefore / 1440} days before`}
                </div>
              </div>
            )}
            <div className="col-span-2">
              <span className="text-muted-foreground">Time:</span>
              <div className="font-medium mt-1">
                {task.startAt ? format(new Date(task.startAt), "MMM d, h:mm a") : "N/A"} - {task.endAt ? format(new Date(task.endAt), "h:mm a") : "N/A"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
            {!deleteConfirm ? (
              <div className="flex gap-2">
                {task.status !== "IN_PROGRESS" && task.status !== "COMPLETED" && (
                  <Button 
                    onClick={handleStartTimer}
                    disabled={isPending}
                    className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 shadow-lg shadow-primary/25 transition-all"
                  >
                    <Play className="w-4 h-4 mr-2" fill="currentColor" /> Start / In Progress
                  </Button>
                )}
                
                {task.status !== "COMPLETED" && (
                  <Button 
                    onClick={handleComplete} 
                    disabled={isPending}
                    variant="outline"
                    className="flex-1 rounded-xl border-green-500/20 hover:bg-green-500/10 hover:text-green-500"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Complete
                  </Button>
                )}

                <Button 
                  onClick={() => setDeleteConfirm(true)}
                  variant="outline"
                  className="rounded-xl px-3 border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                <p className="text-sm font-medium text-red-500">
                  {isRecurring ? "Delete recurring task?" : "Are you sure you want to delete this task?"}
                </p>
                {isRecurring ? (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" disabled={isPending} onClick={() => handleDelete("THIS_TASK")} className="w-full justify-start hover:bg-red-500/20 hover:text-red-500 border-red-500/20">This task only (Skip)</Button>
                    <Button variant="outline" disabled={isPending} onClick={() => handleDelete("THIS_AND_FUTURE")} className="w-full justify-start hover:bg-red-500/20 hover:text-red-500 border-red-500/20">This and future tasks</Button>
                    <Button variant="outline" disabled={isPending} onClick={() => handleDelete("ALL_TASKS")} className="w-full justify-start hover:bg-red-500/20 hover:text-red-500 border-red-500/20">Entire series</Button>
                  </div>
                ) : (
                  <Button 
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => handleDelete("THIS_TASK")}
                    className="w-full"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes, Delete Task"}
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  disabled={isPending}
                  className="w-full mt-2" 
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
