"use client"

import React, { useState } from "react"
import { createManualTimeEntry } from "@/lib/actions/timer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"

export function AddManualEntryDialog({ categories = [] }: { categories?: any[] }) {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  
  const [title, setTitle] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)

  // We'll use simple datetime-local inputs
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 3600000)
  
  // Format for datetime-local input: YYYY-MM-DDThh:mm
  const formatForInput = (d: Date) => {
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }

  const [startAt, setStartAt] = useState(formatForInput(oneHourAgo))
  const [endAt, setEndAt] = useState(formatForInput(now))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsPending(true)
    try {
      const startDate = new Date(startAt)
      const endDate = new Date(endAt)
      
      await createManualTimeEntry({
        title,
        categoryId,
        startedAt: startDate,
        endedAt: endDate,
      })
      
      setOpen(false)
      setTitle("")
      setCategoryId(null)
      setStartAt(formatForInput(new Date(new Date().getTime() - 3600000)))
      setEndAt(formatForInput(new Date()))
    } catch (e: any) {
      alert("Failed to add entry: " + e.message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5" />
        }
      >
        <Plus className="w-4 h-4 mr-2" /> Log Time Manually
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Past Time</DialogTitle>
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

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
