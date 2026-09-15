"use client"

import React, { useState } from "react"
import { updateTimeEntry } from "@/lib/actions/timer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export function EditEntryDialog({ 
  entry, 
  categories = [],
  open, 
  onOpenChange 
}: { 
  entry: any,
  categories?: any[],
  open: boolean, 
  onOpenChange: (open: boolean) => void 
}) {
  const [isPending, setIsPending] = useState(false)
  
  const [title, setTitle] = useState(entry?.title || "")
  const [categoryId, setCategoryId] = useState<string | null>(entry?.categoryId || null)
  
  const formatForInput = (d: Date | string) => {
    const date = new Date(d)
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  const [startAt, setStartAt] = useState(entry ? formatForInput(entry.startedAt) : "")
  const [endAt, setEndAt] = useState(entry ? formatForInput(entry.endedAt) : "")

  // Update local state if the entry prop changes
  React.useEffect(() => {
    if (entry) {
      setTitle(entry.title)
      setCategoryId(entry.categoryId || null)
      setStartAt(formatForInput(entry.startedAt))
      setEndAt(formatForInput(entry.endedAt))
    }
  }, [entry])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !entry) return

    setIsPending(true)
    try {
      const startDate = new Date(startAt)
      const endDate = new Date(endAt)
      
      await updateTimeEntry(entry.id, {
        title,
        startedAt: startDate,
        endedAt: endDate,
        categoryId: categoryId || undefined,
        projectId: entry.projectId
      })
      
      onOpenChange(false)
    } catch (e: any) {
      alert("Failed to update entry: " + e.message)
    } finally {
      setIsPending(false)
    }
  }

  if (!entry) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Time Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Task Title</label>
            <Input 
              placeholder="What did you work on?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Category</label>
            <Select value={categoryId || "NONE"} onValueChange={(val) => setCategoryId(val === "NONE" ? null : val)} disabled={isPending}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None (Uncategorized)</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center">
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Started At</label>
              <Input 
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Ended At</label>
              <Input 
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
