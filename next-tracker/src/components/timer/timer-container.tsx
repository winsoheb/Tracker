"use client"

import React from "react"
import { useTimer } from "@/hooks/use-timer"
import { StartTimer } from "./start-timer"
import { ActiveTimer } from "./active-timer"

export function TimerContainer({ categories = [] }: { categories?: any[] }) {
  const timerProps = useTimer()

  return (
    <div className="space-y-6 w-full flex flex-col items-center">
      <StartTimer {...timerProps} categories={categories} />
      
      <div className="flex flex-row flex-wrap justify-center items-stretch gap-6 w-full">
        {timerProps.isLoading ? (
          <div className="glass p-6 rounded-2xl w-full max-w-sm flex flex-col items-center justify-center animate-pulse gap-4">
            <div className="h-4 w-24 bg-foreground/10 rounded" />
            <div className="h-10 w-48 bg-foreground/10 rounded" />
            <div className="flex gap-2">
              <div className="h-12 w-12 rounded-full bg-foreground/10" />
              <div className="h-12 w-12 rounded-full bg-foreground/10" />
            </div>
          </div>
        ) : (
          timerProps.timers?.map(timer => (
            <ActiveTimer key={timer.id} timer={timer} timerProps={timerProps} />
          ))
        )}
      </div>
    </div>
  )
}
