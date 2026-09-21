"use client"

import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Square, Pause, Maximize2, Minimize2, Loader2, PictureInPicture } from "lucide-react"
import { useTimer, RunningTimerData } from "@/hooks/use-timer"
import { formatDuration } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"

export function GlobalTimerBanner() {
  const { status } = useSession()
  const timerProps = useTimer()
  const [isExpanded, setIsExpanded] = useState(true)
  const [pipWindow, setPipWindow] = useState<Window | null>(null)

  useEffect(() => {
    return () => {
      if (pipWindow) {
        pipWindow.close()
      }
    }
  }, [pipWindow])

  // Only render if authenticated and there are timers
  if (status !== "authenticated" || !timerProps.timers || timerProps.timers.length === 0) {
    if (pipWindow) pipWindow.close()
    return null
  }

  const activeTimer = timerProps.timers[0]
  if (!activeTimer) return null

  const togglePip = async () => {
    if (pipWindow) {
      pipWindow.close()
      return
    }

    if (!('documentPictureInPicture' in window)) {
      alert("Your browser does not support the Document Picture-in-Picture API yet. Please try Chrome or Edge.")
      return
    }

    try {
      // @ts-ignore
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 320,
        height: 180,
      })

      // Copy stylesheets robustly
      document.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
        pip.document.head.appendChild(node.cloneNode(true))
      })

      // Apply root classes for dark mode, base theme, and fonts
      pip.document.documentElement.className = document.documentElement.className
      pip.document.documentElement.style.cssText = document.documentElement.style.cssText
      pip.document.body.className = `${document.body.className} !h-screen !min-h-0 flex items-center justify-center overflow-hidden`
      pip.document.body.style.cssText = document.body.style.cssText

      pip.addEventListener("pagehide", () => {
        setPipWindow(null)
      })

      setPipWindow(pip)
    } catch (e) {
      console.error(e)
      alert("Failed to open Picture-in-Picture window.")
    }
  }

  const content = (
    <BannerContent 
      timer={activeTimer} 
      timerProps={timerProps} 
      isExpanded={isExpanded} 
      onToggleExpand={() => setIsExpanded(!isExpanded)} 
      onTogglePip={togglePip}
      isPip={!!pipWindow}
    />
  )

  if (pipWindow) {
    return createPortal(content, pipWindow.document.body)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.3 }}
        className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-[100] flex flex-col items-end"
      >
        {content}
      </motion.div>
    </AnimatePresence>
  )
}

function BannerContent({ 
  timer, 
  timerProps, 
  isExpanded, 
  onToggleExpand,
  onTogglePip,
  isPip
}: { 
  timer: RunningTimerData
  timerProps: ReturnType<typeof useTimer>
  isExpanded: boolean
  onToggleExpand: () => void
  onTogglePip: () => void
  isPip: boolean
}) {
  const { isPending, handlePause, handleResume, handleStop } = timerProps
  const isRunning = !timer.pausedAt
  
  // Compact Mode
  if (!isExpanded && !isPip) {
    return (
      <div className="flex items-center gap-3 p-2 px-3 rounded-full border border-border bg-background/60 backdrop-blur-md shadow-lg shadow-black/5">
        <div className="relative flex h-2.5 w-2.5">
          {isRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRunning ? 'bg-primary' : 'bg-muted-foreground'}`}></span>
        </div>
        
        <div className="font-mono text-sm tracking-tight font-medium w-16 text-center">
          <TimeDisplay timer={timer} />
        </div>

        <div className="flex items-center gap-1 border-l border-border pl-2">
          {isRunning ? (
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-foreground hover:bg-muted" onClick={() => handlePause(timer.id)} disabled={isPending} aria-label="Pause timer">
              <Pause className="w-3.5 h-3.5" fill="currentColor" />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-green-500 hover:bg-muted" onClick={() => handleResume(timer.id)} disabled={isPending} aria-label="Resume timer">
              <Play className="w-3.5 h-3.5" fill="currentColor" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-destructive hover:bg-destructive/10" onClick={() => handleStop(timer.id)} disabled={isPending} aria-label="Stop timer">
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" fill="currentColor" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground ml-1" onClick={onToggleExpand} aria-label="Expand timer">
            <Maximize2 className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-primary hover:bg-primary/10" onClick={onTogglePip} aria-label="Pop out">
            <PictureInPicture className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  // Expanded Mode (or PiP Mode)
  return (
    <div className={`flex flex-col p-4 rounded-xl border border-border bg-background/80 backdrop-blur-xl shadow-2xl shadow-black/10 overflow-hidden relative ${isPip ? 'w-full h-full border-none shadow-none justify-center' : 'w-[300px]'}`}>
      {isRunning && (
        <motion.div 
          className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-purple-500"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
        />
      )}
      
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            {isRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRunning ? 'bg-primary' : 'bg-muted-foreground'}`}></span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isRunning ? 'Working' : 'Paused'}
          </span>
        </div>
        <div className="flex gap-1">
          {!isPip && (
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground hover:text-foreground" onClick={onToggleExpand} aria-label="Collapse timer">
              <Minimize2 className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className={`h-6 w-6 rounded-full hover:text-primary ${isPip ? 'text-primary' : 'text-muted-foreground'}`} onClick={onTogglePip} aria-label={isPip ? "Close Pop out" : "Pop out"}>
            <PictureInPicture className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-medium text-sm text-foreground truncate" title={timer.title}>
          {timer.title || "Untitled Task"}
        </h3>
        {(timer.project || timer.category) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 truncate">
            {timer.category && (
              <>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: timer.category.color || 'var(--color-primary)' }} />
                <span>{timer.category.name}</span>
              </>
            )}
            {timer.project && timer.category && <span>·</span>}
            {timer.project && <span>{timer.project.name}</span>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
        <div className="font-mono text-xl tracking-tight">
          <TimeDisplay timer={timer} />
        </div>
        <div className="flex items-center gap-1.5">
          {isRunning ? (
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-primary/30 text-primary hover:bg-primary/10" onClick={() => handlePause(timer.id)} disabled={isPending} aria-label="Pause timer">
              <Pause className="w-4 h-4" fill="currentColor" />
            </Button>
          ) : (
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-green-500/30 text-green-500 hover:bg-green-500/10" onClick={() => handleResume(timer.id)} disabled={isPending} aria-label="Resume timer">
              <Play className="w-4 h-4" fill="currentColor" />
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleStop(timer.id)} disabled={isPending} aria-label="Stop timer">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" fill="currentColor" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

function TimeDisplay({ timer }: { timer: RunningTimerData }) {
  const [seconds, setSeconds] = useState(() => {
    let duration = timer.accumulatedDuration
    if (!timer.pausedAt) {
      const started = new Date(timer.startedAt)
      duration += Math.floor((new Date().getTime() - started.getTime()) / 1000)
    }
    return duration
  })

  useEffect(() => {
    if (timer.pausedAt) {
      setSeconds(timer.accumulatedDuration)
      return
    }
    
    const started = new Date(timer.startedAt)
    const initialDuration = timer.accumulatedDuration + Math.floor((new Date().getTime() - started.getTime()) / 1000)
    setSeconds(initialDuration)

    const interval = setInterval(() => {
      setSeconds(timer.accumulatedDuration + Math.floor((new Date().getTime() - started.getTime()) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [timer.pausedAt, timer.startedAt, timer.accumulatedDuration])

  return <>{formatDuration(seconds)}</>
}
