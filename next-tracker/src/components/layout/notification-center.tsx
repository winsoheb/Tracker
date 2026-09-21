"use client"

import React, { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { getNotifications, NotificationAlert } from "@/lib/actions/notifications"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationAlert[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Fetch notifications on mount and when opened
  const fetchAlerts = async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error("Failed to load notifications", error)
    }
  }

  useEffect(() => {
    fetchAlerts()
    // Poll every 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const unreadCount = notifications.length

  return (
    <Popover open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (open) fetchAlerts()
    }}>
      <PopoverTrigger className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors cursor-pointer outline-none">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-background/80 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5">
          <h3 className="font-medium text-sm text-foreground/90 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> 
            Notifications
          </h3>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground/60">
              You're all caught up!
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((alert) => (
                <div key={alert.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-semibold tracking-wider uppercase ${alert.type === 'UPCOMING' ? 'text-blue-400' : 'text-red-400'}`}>
                      {alert.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap">
                      {formatDistanceToNow(new Date(alert.time), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-snug">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
