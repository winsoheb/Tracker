"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Download } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, subDays, startOfWeek, startOfMonth } from "date-fns"

export function ReportFilters({ entries }: { entries: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentRange = searchParams.get("range") || "today"

  const setRange = (range: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("range", range)
    
    const today = new Date()
    const endOfToday = new Date(today)
    endOfToday.setHours(23,59,59,999)

    if (range === "today") {
      const start = new Date(today)
      start.setHours(0,0,0,0)
      params.set("start", start.toISOString())
      params.set("end", endOfToday.toISOString())
    } else if (range === "7d") {
      const start = new Date(today)
      start.setDate(start.getDate() - 6) // 7 days including today
      start.setHours(0,0,0,0)
      params.set("start", start.toISOString())
      params.set("end", endOfToday.toISOString())
    } else if (range === "30d") {
      const start = new Date(today)
      start.setDate(start.getDate() - 29)
      start.setHours(0,0,0,0)
      params.set("start", start.toISOString())
      params.set("end", endOfToday.toISOString())
    } else if (range === "this_week") {
      params.set("start", startOfWeek(today).toISOString())
      params.set("end", endOfToday.toISOString())
    } else if (range === "this_month") {
      params.set("start", startOfMonth(today).toISOString())
      params.set("end", endOfToday.toISOString())
    } else {
      params.delete("start")
      params.delete("end")
    }
    
    router.push(`/reports?${params.toString()}`)
  }

  const exportCSV = () => {
    if (!entries.length) return
    
    const headers = ["Task", "Category", "Project", "Date", "Duration (Seconds)"]
    const rows = entries.map(e => [
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.category?.name || 'Uncategorized'}"`,
      `"${e.project?.name || ''}"`,
      format(new Date(e.startedAt), "yyyy-MM-dd HH:mm:ss"),
      e.duration
    ])
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `timetracker_report_${format(new Date(), "yyyyMMdd")}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 glass rounded-xl">
      <div className="flex items-center gap-2">
        <Button 
          variant={currentRange === "today" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setRange("today")}
          className="rounded-lg"
        >
          Today
        </Button>
        <Button 
          variant={currentRange === "all" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setRange("all")}
          className="rounded-lg"
        >
          All Time
        </Button>
        <Button 
          variant={currentRange === "7d" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setRange("7d")}
          className="rounded-lg"
        >
          Last 7 Days
        </Button>
        <Button 
          variant={currentRange === "30d" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setRange("30d")}
          className="rounded-lg"
        >
          Last 30 Days
        </Button>
      </div>

      <Button onClick={exportCSV} variant="outline" size="sm" className="rounded-lg border-primary/50 text-primary hover:bg-primary hover:text-white">
        <Download className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
    </div>
  )
}
