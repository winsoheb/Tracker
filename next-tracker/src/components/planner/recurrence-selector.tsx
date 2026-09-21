"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export type RecurrenceState = {
  frequency: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
  interval: number
  daysOfWeek?: number[]
  dayOfMonth?: number
  monthOfYear?: number
  occurrenceIndex?: number
  endType: "NEVER" | "ON_DATE" | "AFTER_OCCURRENCES"
  endDate?: Date
  occurrenceCount?: number
}

const DEFAULT_RECURRENCE: RecurrenceState = {
  frequency: "NONE",
  interval: 1,
  endType: "NEVER"
}

export function RecurrenceSelector({
  taskDate,
  value,
  onChange
}: {
  taskDate: Date
  value: RecurrenceState
  onChange: (val: RecurrenceState) => void
}) {
  const [customOpen, setCustomOpen] = useState(false)
  const [tempState, setTempState] = useState<RecurrenceState>(value)

  // Quick preset options
  const handleQuickSelect = (preset: string) => {
    const dayOfWeek = (taskDate.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
    const dayOfMonth = taskDate.getDate()
    const monthOfYear = taskDate.getMonth() + 1 // 1-indexed for rrule bymonth

    let newState: RecurrenceState = { ...DEFAULT_RECURRENCE }

    switch (preset) {
      case "NONE":
        newState.frequency = "NONE"
        break
      case "DAILY":
        newState.frequency = "DAILY"
        newState.interval = 1
        break
      case "WEEKDAY":
        newState.frequency = "WEEKLY"
        newState.interval = 1
        newState.daysOfWeek = [0, 1, 2, 3, 4] // Mon-Fri
        break
      case "WEEKLY":
        newState.frequency = "WEEKLY"
        newState.interval = 1
        newState.daysOfWeek = [dayOfWeek]
        break
      case "MONTHLY":
        newState.frequency = "MONTHLY"
        newState.interval = 1
        newState.dayOfMonth = dayOfMonth
        break
      case "QUARTERLY":
        newState.frequency = "MONTHLY"
        newState.interval = 3
        newState.dayOfMonth = dayOfMonth
        break
      case "YEARLY":
        newState.frequency = "YEARLY"
        newState.interval = 1
        newState.monthOfYear = monthOfYear
        newState.dayOfMonth = dayOfMonth
        break
      case "CUSTOM":
        setTempState(value.frequency !== "NONE" ? value : { ...newState, frequency: "WEEKLY", daysOfWeek: [dayOfWeek] })
        setCustomOpen(true)
        return // Do not call onChange yet
    }
    onChange(newState)
  }

  // Generate Human Readable Summary
  const getSummary = (state: RecurrenceState) => {
    if (state.frequency === "NONE") return "Does not repeat"
    
    let text = `Repeats every ${state.interval > 1 ? state.interval + " " : ""}`
    
    if (state.frequency === "DAILY") text += state.interval > 1 ? "days" : "day"
    if (state.frequency === "WEEKLY") {
      text += state.interval > 1 ? "weeks" : "week"
      if (state.daysOfWeek && state.daysOfWeek.length > 0) {
        if (state.daysOfWeek.length === 5 && [0,1,2,3,4].every(d => state.daysOfWeek?.includes(d))) {
          return "Repeats every weekday"
        }
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        const selected = state.daysOfWeek.sort().map(d => dayNames[d])
        text += ` on ${selected.join(", ")}`
      }
    }
    if (state.frequency === "MONTHLY") {
      if (state.interval === 3 && !state.dayOfMonth) return "Repeats quarterly"
      text += state.interval > 1 ? "months" : "month"
      if (state.dayOfMonth) text += ` on the ${state.dayOfMonth}`
    }
    if (state.frequency === "YEARLY") {
      text += state.interval > 1 ? "years" : "year"
    }

    if (state.endType === "ON_DATE" && state.endDate) {
      text += ` until ${new Date(state.endDate).toLocaleDateString()}`
    } else if (state.endType === "AFTER_OCCURRENCES" && state.occurrenceCount) {
      text += `, for ${state.occurrenceCount} times`
    }

    return text
  }

  const currentSelectValue = () => {
    if (value.frequency === "NONE") return "NONE"
    if (value.frequency === "DAILY" && value.interval === 1) return "DAILY"
    if (value.frequency === "WEEKLY" && value.interval === 1 && value.daysOfWeek?.length === 5) return "WEEKDAY"
    if (value.frequency === "WEEKLY" && value.interval === 1 && value.daysOfWeek?.length === 1) return "WEEKLY"
    if (value.frequency === "MONTHLY" && value.interval === 1) return "MONTHLY"
    if (value.frequency === "MONTHLY" && value.interval === 3) return "QUARTERLY"
    if (value.frequency === "YEARLY" && value.interval === 1) return "YEARLY"
    return "CUSTOM"
  }

  const toggleDay = (day: number) => {
    const days = tempState.daysOfWeek || []
    if (days.includes(day)) {
      setTempState({ ...tempState, daysOfWeek: days.filter(d => d !== day) })
    } else {
      setTempState({ ...tempState, daysOfWeek: [...days, day] })
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 group">
        <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground group-focus-within:text-primary transition-colors">Repeat</label>
        <select
          value={currentSelectValue()}
          onChange={(e) => handleQuickSelect(e.target.value)}
          className="w-full bg-white/5 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl h-12 px-4 text-base shadow-inner text-foreground appearance-none cursor-pointer"
        >
          <option value="NONE" className="bg-background text-foreground">Does not repeat</option>
          <option value="DAILY" className="bg-background text-foreground">Daily</option>
          <option value="WEEKDAY" className="bg-background text-foreground">Every weekday (Mon-Fri)</option>
          <option value="WEEKLY" className="bg-background text-foreground">Weekly</option>
          <option value="MONTHLY" className="bg-background text-foreground">Monthly</option>
          <option value="QUARTERLY" className="bg-background text-foreground">Quarterly</option>
          <option value="YEARLY" className="bg-background text-foreground">Yearly</option>
          <option value="CUSTOM" className="bg-background text-foreground">Custom...</option>
        </select>
      </div>

      {value.frequency !== "NONE" && (
        <div className="text-sm font-medium text-primary/80 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
          ↻ {getSummary(value)}
        </div>
      )}

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="sm:max-w-[400px] border-white/10 bg-background/95 backdrop-blur-3xl shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Custom Recurrence</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-4">
              <span className="text-sm w-20">Repeat every</span>
              <Input 
                type="number" 
                min={1} 
                className="w-20" 
                value={tempState.interval} 
                onChange={(e) => setTempState({...tempState, interval: parseInt(e.target.value) || 1})} 
              />
              <select 
                className="bg-transparent border rounded p-2 flex-1"
                value={tempState.frequency}
                onChange={(e) => setTempState({...tempState, frequency: e.target.value as any})}
              >
                <option value="DAILY">Days</option>
                <option value="WEEKLY">Weeks</option>
                <option value="MONTHLY">Months</option>
                <option value="YEARLY">Years</option>
              </select>
            </div>

            {tempState.frequency === "WEEKLY" && (
              <div className="space-y-2">
                <span className="text-sm block">Repeat on</span>
                <div className="flex gap-1 justify-between">
                  {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        tempState.daysOfWeek?.includes(i)
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                          : "bg-white/5 hover:bg-white/10 text-muted-foreground"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <span className="text-sm block">Ends</span>
              <div className="space-y-2">
                <label className="flex items-center gap-3 text-sm">
                  <input type="radio" name="endType" checked={tempState.endType === "NEVER"} onChange={() => setTempState({...tempState, endType: "NEVER"})} />
                  Never
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <input type="radio" name="endType" checked={tempState.endType === "ON_DATE"} onChange={() => setTempState({...tempState, endType: "ON_DATE"})} />
                  On date
                  {tempState.endType === "ON_DATE" && (
                    <Input type="date" className="h-8" onChange={(e) => setTempState({...tempState, endDate: new Date(e.target.value)})} />
                  )}
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <input type="radio" name="endType" checked={tempState.endType === "AFTER_OCCURRENCES"} onChange={() => setTempState({...tempState, endType: "AFTER_OCCURRENCES"})} />
                  After
                  {tempState.endType === "AFTER_OCCURRENCES" && (
                    <div className="flex items-center gap-2">
                      <Input type="number" className="h-8 w-20" min={1} value={tempState.occurrenceCount || 1} onChange={(e) => setTempState({...tempState, occurrenceCount: parseInt(e.target.value)})} />
                      <span>occurrences</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setCustomOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                onChange(tempState)
                setCustomOpen(false)
              }}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
