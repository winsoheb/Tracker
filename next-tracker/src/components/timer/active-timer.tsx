"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Square, Pause, X, Loader2, Maximize } from "lucide-react"
import { useTimer, RunningTimerData } from "@/hooks/use-timer"
import { formatDuration } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function ActiveTimer({ timer, timerProps }: { timer: RunningTimerData, timerProps: ReturnType<typeof useTimer> }) {
  const { 
    isPending, 
    handlePause, 
    handleResume, 
    handleStop, 
    handleCancel 
  } = timerProps

  const isRunning = !timer.pausedAt
  const isPaused = !!timer.pausedAt

  const [isFocusMode, setIsFocusMode] = React.useState(false)



  const focusClasses = isFocusMode 
    ? "fixed inset-0 z-[100] bg-background/95 backdrop-blur-3xl flex items-center justify-center p-8"
    : "relative w-full sm:w-[340px] shrink-0 flex flex-col"

  return (
    <AnimatePresence>
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${focusClasses} transition-all duration-700`}
      >
        <motion.div 
          layout
          className={`relative rounded-2xl w-full transition-all duration-500 border bg-background/50 backdrop-blur-md shadow-sm flex-1 flex flex-col ${isFocusMode ? 'max-w-4xl p-12 md:p-20 scale-110 shadow-[0_0_100px_rgba(147,51,234,0.15)] border-primary/20' : 'p-6 md:p-8 hover:bg-muted/50 items-center justify-center gap-6'} ${isRunning && !isFocusMode ? 'border-primary/40 shadow-[0_0_15px_rgba(147,51,234,0.1)]' : 'border-border'}`}
        >
          {/* Animated gradient strip indicator when running */}
          {isRunning && !isFocusMode && (
            <motion.div 
              className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-purple-500 rounded-l-2xl"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
            />
          )}
            
            <div className={`relative glass-panel bg-transparent flex flex-col items-center justify-between gap-6 z-10 w-full flex-1`}>
            {/* Toggle Focus Mode Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground rounded-full z-20"
              title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            >
              {isFocusMode ? <X className="w-5 h-5" /> : <Maximize className="w-3.5 h-3.5" />}
            </Button>

            {/* Info & Status */}
            <motion.div layout className="w-full text-center flex flex-col items-center justify-center gap-2 mt-4 flex-1">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <div className="relative flex h-2.5 w-2.5">
                  {isRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRunning ? 'bg-primary' : 'bg-muted-foreground'}`}></span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  {isRunning ? 'Active Timer' : 'Paused'}
                </span>
              </div>
              
              <h2 className={`${isFocusMode ? 'text-4xl md:text-5xl' : 'text-xl font-semibold'} truncate text-foreground transition-all duration-500 max-w-full px-4`}>
                {timer.title}
              </h2>
              {timer.category && (
                <div className={`${isFocusMode ? 'text-lg mt-2' : 'text-xs'} text-muted-foreground flex items-center justify-center gap-1.5 transition-all truncate mt-1`}>
                  <span className={`shrink-0 ${isFocusMode ? 'w-3 h-3' : 'w-2 h-2'} rounded-full`} style={{ backgroundColor: timer.category.color || 'var(--color-primary)' }} />
                  <span className="truncate">{timer.category.name}</span>
                </div>
              )}
            </motion.div>

            {/* Time Display */}
            <motion.div layout className={`shrink-0 font-mono ${isFocusMode ? 'text-7xl md:text-9xl tracking-tighter text-foreground' : 'text-4xl tracking-tight text-foreground/90'} font-light flex items-center justify-center transition-all duration-500 w-full`}>
              <TimeDisplay timer={timer} />
            </motion.div>

            {/* Actions */}
            <motion.div layout className="shrink-0 flex flex-wrap items-center justify-center gap-4 mt-2">
              {isRunning ? (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`${isFocusMode ? 'h-20 w-20' : 'h-14 w-14'} rounded-full border-primary/50 text-primary hover:bg-primary/20 transition-all shadow-sm`}
                    onClick={() => handlePause(timer.id)}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Pause className={`${isFocusMode ? 'w-8 h-8' : 'w-6 h-6'}`} fill="currentColor" />}
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`${isFocusMode ? 'h-20 w-20' : 'h-14 w-14'} rounded-full border-green-500/50 text-green-500 hover:bg-green-500/20 transition-all shadow-sm`}
                    onClick={() => handleResume(timer.id)}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className={`${isFocusMode ? 'w-8 h-8' : 'w-6 h-6'}`} fill="currentColor" />}
                  </Button>
                </motion.div>
              )}

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`${isFocusMode ? 'h-20 w-20' : 'h-14 w-14'} rounded-full border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all shadow-sm`}
                  onClick={() => handleStop(timer.id)}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Square className={`${isFocusMode ? 'w-8 h-8' : 'w-6 h-6'}`} fill="currentColor" />}
                </Button>
              </motion.div>

              {isPaused && (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`${isFocusMode ? 'h-12 w-12' : 'h-12 w-12'} rounded-full text-muted-foreground hover:text-destructive`}
                    onClick={() => handleCancel(timer.id)}
                    disabled={isPending}
                    title="Cancel Timer"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function TimeDisplay({ timer }: { timer: RunningTimerData }) {
  const [seconds, setSeconds] = React.useState(() => {
    let duration = timer.accumulatedDuration
    if (!timer.pausedAt) {
      const started = new Date(timer.startedAt)
      duration += Math.floor((new Date().getTime() - started.getTime()) / 1000)
    }
    return duration
  })

  React.useEffect(() => {
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
