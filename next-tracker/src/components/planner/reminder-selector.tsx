"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ReminderSelector({
  value,
  onChange
}: {
  value: number | null
  onChange: (val: number | null) => void
}) {
  const [customOpen, setCustomOpen] = useState(false)
  const [customAmount, setCustomAmount] = useState(1)
  const [customUnit, setCustomUnit] = useState<"MINUTES" | "HOURS" | "DAYS">("HOURS")

  const handleQuickSelect = (preset: string) => {
    if (preset === "NONE") {
      onChange(null)
    } else if (preset === "CUSTOM") {
      setCustomOpen(true)
    } else {
      onChange(parseInt(preset))
    }
  }

  const handleSaveCustom = () => {
    let minutes = customAmount
    if (customUnit === "HOURS") minutes = customAmount * 60
    if (customUnit === "DAYS") minutes = customAmount * 1440
    onChange(minutes)
    setCustomOpen(false)
  }

  const getCurrentSelectValue = () => {
    if (value === null) return "NONE"
    if ([0, 5, 10, 15, 30, 60, 1440].includes(value)) return value.toString()
    return "CUSTOM"
  }

  const getSummary = () => {
    if (value === null) return null
    if (value === 0) return "At start time"
    if (value < 60) return `${value} minutes before`
    if (value < 1440) return `${value / 60} hours before`
    return `${value / 1440} days before`
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2 group">
        <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground group-focus-within:text-primary transition-colors">Reminder</label>
        <select
          value={getCurrentSelectValue()}
          onChange={(e) => handleQuickSelect(e.target.value)}
          className="w-full bg-white/5 border-white/10 focus-visible:ring-primary/50 focus-visible:border-primary/50 transition-all rounded-xl h-12 px-4 text-base shadow-inner text-foreground appearance-none cursor-pointer"
        >
          <option value="NONE" className="bg-background text-foreground">None</option>
          <option value="0" className="bg-background text-foreground">At start time</option>
          <option value="5" className="bg-background text-foreground">5 minutes before</option>
          <option value="10" className="bg-background text-foreground">10 minutes before</option>
          <option value="15" className="bg-background text-foreground">15 minutes before</option>
          <option value="30" className="bg-background text-foreground">30 minutes before</option>
          <option value="60" className="bg-background text-foreground">1 hour before</option>
          <option value="1440" className="bg-background text-foreground">1 day before</option>
          <option value="CUSTOM" className="bg-background text-foreground">Custom...</option>
        </select>
      </div>

      {value !== null && getCurrentSelectValue() === "CUSTOM" && (
        <div className="text-sm font-medium text-primary/80 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
          🔔 {getSummary()}
        </div>
      )}

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="sm:max-w-[400px] border-white/10 bg-background/95 backdrop-blur-3xl shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Custom Reminder</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-4">
              <span className="text-sm">Remind me</span>
              <Input 
                type="number" 
                min={1} 
                className="w-20" 
                value={customAmount} 
                onChange={(e) => setCustomAmount(parseInt(e.target.value) || 1)} 
              />
              <select 
                className="bg-transparent border rounded p-2 flex-1"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value as any)}
              >
                <option value="MINUTES">Minutes</option>
                <option value="HOURS">Hours</option>
                <option value="DAYS">Days</option>
              </select>
              <span className="text-sm">before</span>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setCustomOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveCustom}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
