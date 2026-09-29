"use client"

import React, { useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { CalendarIcon, Download } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, subDays, startOfWeek, startOfMonth } from "date-fns"

export function ReportFilters({ entries }: { entries: any[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  const currentRange = searchParams.get("range") || "today"
  const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({
    from: searchParams.get("start") ? new Date(searchParams.get("start") as string) : undefined,
    to: searchParams.get("end") ? new Date(searchParams.get("end") as string) : undefined
  })
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [isPending, startTransition] = React.useTransition()
  
  const setRange = (range: string, customStart?: Date, customEnd?: Date) => {
    const params = new URLSearchParams(searchParams.toString())
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
    } else if (range === "custom" && customStart && customEnd) {
      customStart.setHours(0,0,0,0)
      customEnd.setHours(23,59,59,999)
      params.set("start", customStart.toISOString())
      params.set("end", customEnd.toISOString())
    } else {
      params.delete("start")
      params.delete("end")
    }
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  React.useEffect(() => {
    if (isPending) {
      document.body.classList.add("reports-loading")
    } else {
      document.body.classList.remove("reports-loading")
    }
    return () => document.body.classList.remove("reports-loading")
  }, [isPending])

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
    <div className={`flex flex-wrap items-center justify-between gap-4 mb-6 p-4 glass rounded-xl transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex items-center gap-2 flex-wrap">
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

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger 
            className={buttonVariants({ variant: currentRange === "custom" ? "default" : "outline", size: "sm", className: "rounded-lg" })}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            {currentRange === "custom" && dateRange.from && dateRange.to ? (
              `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
            ) : "Custom Range"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange as any}
              onSelect={(range: any) => {
                setDateRange(range)
                if (range?.from && range?.to) {
                  setRange("custom", range.from, range.to)
                  setCalendarOpen(false)
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button onClick={exportCSV} variant="outline" size="sm" className="rounded-lg border-primary/50 text-primary hover:bg-primary hover:text-white">
        <Download className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
    </div>
  )
}
