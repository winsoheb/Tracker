"use client"

import React from "react"
import { useTimer } from "@/hooks/use-timer"
import { StartTimer } from "./start-timer"
import { ActiveTimer } from "./active-timer"

export function TimerContainer({ categories = [] }: { categories?: any[] }) {
  const timerProps = useTimer()

  return (
    <>
      <StartTimer {...timerProps} categories={categories} />
      <ActiveTimer {...timerProps} />
    </>
  )
}
