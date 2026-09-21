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
          <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 hover:border-white/20 transition-all duration-300 shadow-sm backdrop-blur-md" />
        }
      >
        <Plus className="w-4 h-4 mr-2 text-primary" /> Log Time Manually
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] border-white/10 bg-background/40 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.6)] rounded-3xl overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none -z-10 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none -z-10 -translate-x-1/3 translate-y-1/3" />

        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-tight bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">
            Log Past Time
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6 pt-4 relative z-10">
          <div className="space-y-2 group">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground group-focus-within:text-primary transition-colors">Task Title</label>
            <Input 
              placeholder="What did you work on?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending}
              autoFocus
              required
              className="bg-white/5 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl h-12 text-base shadow-inner"
            />
          </div>

          <div className="space-y-2 group">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground transition-colors">Category</label>
            <Select value={categoryId || "NONE"} onValueChange={(val) => setCategoryId(val === "NONE" ? null : val)} disabled={isPending}>
              <SelectTrigger className="bg-white/5 border-white/10 focus:ring-primary/50 rounded-xl h-12 text-base shadow-inner">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-background/80 backdrop-blur-xl border-white/10 rounded-xl shadow-2xl">
                <SelectItem value="NONE" className="rounded-lg focus:bg-white/5 cursor-pointer">None (Uncategorized)</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="rounded-lg focus:bg-white/5 cursor-pointer">
                    <div className="flex items-center">
                      <span className="w-2.5 h-2.5 rounded-full mr-3 shadow-sm" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-5 pt-2">
            <div className="space-y-2 group">
              <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground group-focus-within:text-primary transition-colors">Started At</label>
              <Input 
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                disabled={isPending}
                required
                className="bg-white/5 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl h-12 px-3 text-sm shadow-inner [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2 group">
              <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground group-focus-within:text-primary transition-colors">Ended At</label>
              <Input 
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                disabled={isPending}
                required
                className="bg-white/5 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl h-12 px-3 text-sm shadow-inner [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <Button 
              type="submit" 
              disabled={isPending || !title.trim()}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 transition-all duration-300 font-medium text-base group"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Plus className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              )}
              Save Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
