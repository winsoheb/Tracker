"use client"

import { useState, useEffect, useCallback } from "react"
import { getActiveTimer, startTimer, pauseTimer, resumeTimer, stopTimer, cancelTimer } from "@/lib/actions/timer"

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

export function useTimer(initialTimer: RunningTimerData | null = null) {
  const [timer, setTimer] = useState<RunningTimerData | null>(initialTimer)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isLoading, setIsLoading] = useState(!initialTimer)
  const [isPending, setIsPending] = useState(false) // For mutations

  const fetchTimer = useCallback(async () => {
    try {
      const active = await getActiveTimer()
      // @ts-ignore - Handle Date objects coming from Server Action correctly
      setTimer(active as RunningTimerData | null)
    } catch (e) {
      console.error("Failed to fetch active timer", e)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch if no initialTimer provided
  useEffect(() => {
    if (!initialTimer) {
      fetchTimer()
    } else {
      setIsLoading(false)
    }
  }, [initialTimer, fetchTimer])

  // Tick effect
  useEffect(() => {
    if (!timer) {
      setElapsedSeconds(0)
      return
    }

    const calculateElapsed = () => {
      let duration = timer.accumulatedDuration
      if (!timer.pausedAt) {
        // Must parse dates because Server Actions serialize dates to strings over the wire sometimes,
        // though in modern Next.js it might keep them as Dates, it's safer to instantiate
        const started = new Date(timer.startedAt)
        const sessionDuration = Math.floor((new Date().getTime() - started.getTime()) / 1000)
        duration += sessionDuration
      }
      return duration
    }

    setElapsedSeconds(calculateElapsed())

    if (timer.pausedAt) return

    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed())
    }, 1000)

    return () => clearInterval(interval)
  }, [timer])

  const handleStart = async (data: { title: string, categoryId?: string, projectId?: string }) => {
    setIsPending(true)
    try {
      const newTimer = await startTimer(data)
      // @ts-expect-error
      setTimer(newTimer)
    } catch (e: any) {
      console.error("Failed to start timer:", e)
      alert("Failed to start task: " + e?.message)
    } finally {
      setIsPending(false)
    }
  }

  const handlePause = async () => {
    if (!timer || timer.pausedAt) return
    setIsPending(true)
    try {
      const updated = await pauseTimer()
      // @ts-ignore
      setTimer(updated)
    } finally {
      setIsPending(false)
    }
  }

  const handleResume = async () => {
    if (!timer || !timer.pausedAt) return
    setIsPending(true)
    try {
      const updated = await resumeTimer()
      // @ts-ignore
      setTimer(updated)
    } finally {
      setIsPending(false)
    }
  }

  const handleStop = async () => {
    if (!timer) return
    setIsPending(true)
    try {
      await stopTimer()
      setTimer(null)
      setElapsedSeconds(0)
    } finally {
      setIsPending(false)
    }
  }

  const handleCancel = async () => {
    if (!timer) return
    setIsPending(true)
    try {
      await cancelTimer()
      setTimer(null)
      setElapsedSeconds(0)
    } finally {
      setIsPending(false)
    }
  }

  return {
    timer,
    elapsedSeconds,
    isLoading,
    isPending,
    isRunning: !!timer && !timer.pausedAt,
    isPaused: !!timer && !!timer.pausedAt,
    handleStart,
    handlePause,
    handleResume,
    handleStop,
    handleCancel,
    refresh: fetchTimer
  }
}

