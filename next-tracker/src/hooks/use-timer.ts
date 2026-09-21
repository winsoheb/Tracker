"use client"

import { useState, useEffect, useCallback } from "react"
import { getActiveTimers, startTimer, pauseTimer, resumeTimer, stopTimer, cancelTimer } from "@/lib/actions/timer"

export type RunningTimerData = {
  id: string
  title: string
  categoryId: string | null
  projectId: string | null
  description: string | null
  startedAt: Date
  pausedAt: Date | null
  accumulatedDuration: number
  createdAt: Date
  category?: { name: string, color: string | null, icon: string | null } | null
  project?: { name: string, color: string | null } | null
}

export function useTimer(initialTimers: RunningTimerData[] = []) {
  const [timers, setTimers] = useState<RunningTimerData[]>(initialTimers)
  const [isLoading, setIsLoading] = useState(!initialTimers || initialTimers.length === 0)
  const [isPending, setIsPending] = useState(false) // For mutations

  const fetchTimers = useCallback(async () => {
    try {
      const activeTimers = await getActiveTimers()
      // @ts-ignore
      setTimers(activeTimers as RunningTimerData[])
    } catch (e) {
      console.error("Failed to fetch active timers", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch if no initialTimers provided
  useEffect(() => {
    if (initialTimers.length === 0) {
      fetchTimers()
    } else {
      setIsLoading(false)
    }

    const handleTimerUpdated = () => {
      fetchTimers()
    }
    
    window.addEventListener("timer_updated", handleTimerUpdated)
    return () => window.removeEventListener("timer_updated", handleTimerUpdated)
  }, [initialTimers, fetchTimers])

  // Removed central ticking effect to improve performance.
  // Each ActiveTimer now manages its own tick locally.

  const handleStart = async (data: { title: string, categoryId?: string, projectId?: string }) => {
    setIsPending(true)
    try {
      const newTimer = await startTimer(data)
      setTimers(prev => [...prev, newTimer])
    } catch (e: any) {
      console.error("Failed to start timer:", e)
      alert("Failed to start task: " + e?.message)
    } finally {
      setIsPending(false)
    }
  }

  const handlePause = async (timerId: string) => {
    const target = timers.find(t => t.id === timerId)
    if (!target || target.pausedAt) return
    setIsPending(true)
    try {
      const updated = await pauseTimer(timerId)
      // @ts-ignore
      setTimers(prev => prev.map(t => t.id === timerId ? updated : t))
    } finally {
      setIsPending(false)
    }
  }

  const handleResume = async (timerId: string) => {
    const target = timers.find(t => t.id === timerId)
    if (!target || !target.pausedAt) return
    setIsPending(true)
    try {
      const updated = await resumeTimer(timerId)
      // @ts-ignore
      setTimers(prev => prev.map(t => t.id === timerId ? updated : t))
    } finally {
      setIsPending(false)
    }
  }

  const handleStop = async (timerId: string) => {
    setIsPending(true)
    try {
      await stopTimer(timerId)
      setTimers(prev => prev.filter(t => t.id !== timerId))
    } finally {
      setIsPending(false)
    }
  }

  const handleCancel = async (timerId: string) => {
    setIsPending(true)
    try {
      await cancelTimer(timerId)
      setTimers(prev => prev.filter(t => t.id !== timerId))
    } finally {
      setIsPending(false)
    }
  }

  return {
    timers,
    isLoading,
    isPending,
    handleStart,
    handlePause,
    handleResume,
    handleStop,
    handleCancel,
    refresh: fetchTimers
  }
}

