"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Square, Pause, X, Loader2, Maximize } from "lucide-react"
import { useTimer } from "@/hooks/use-timer"
import { formatDuration } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function ActiveTimer(props: ReturnType<typeof useTimer>) {
  const { 
    timer, 
    elapsedSeconds, 
    isLoading, 
    isPending, 
    isRunning, 
    isPaused, 
    handlePause, 
    handleResume, 
    handleStop, 
    handleCancel 
  } = props

  const [isFocusMode, setIsFocusMode] = React.useState(false)

  if (isLoading) {
    return (
      <div className="glass p-6 rounded-2xl w-full max-w-xl mx-auto flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-white/10" />
          <Skeleton className="h-10 w-48 bg-white/10" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-12 w-12 rounded-full bg-white/10" />
          <Skeleton className="h-12 w-12 rounded-full bg-white/10" />
        </div>
      </div>
    )
  }

  if (!timer) {
    return null
  }

  const focusClasses = isFocusMode 
    ? "fixed inset-0 z-[100] bg-background/95 backdrop-blur-3xl flex items-center justify-center p-8"
    : "relative w-full max-w-xl mx-auto"

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
          className={`relative p-[1px] rounded-3xl overflow-hidden w-full transition-all duration-500 ${isFocusMode ? 'max-w-4xl scale-110 shadow-[0_0_100px_rgba(147,51,234,0.3)]' : 'max-w-xl shadow-2xl'} ${isRunning && !isFocusMode ? 'neon-glow' : ''}`}
        >
          {/* Animated gradient border when running */}
          {isRunning && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-primary opacity-50 blur-md"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, ease: "linear", repeat: Infinity }}
              style={{ backgroundSize: "200% 200%" }}
            />
          )}

          <div className={`relative glass-panel bg-background/90 ${isFocusMode ? 'p-12 md:p-20' : 'p-6'} rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 z-10`}>
            
            {/* Toggle Focus Mode Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsFocusMode(!isFocusMode)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white rounded-full z-20"
              title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            >
              {isFocusMode ? <X className="w-5 h-5" /> : <Maximize className="w-4 h-4" />}
            </Button>

            {/* Info & Status */}
            <motion.div layout className="flex-1 min-w-0 text-center md:text-left flex flex-col gap-2">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <div className="relative flex h-3 w-3">
                  {isRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isRunning ? 'bg-primary' : 'bg-muted-foreground'}`}></span>
                </div>
                <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  {isRunning ? 'Active Timer' : 'Paused'}
                </span>
              </div>
              
              <h2 className={`${isFocusMode ? 'text-4xl md:text-5xl' : 'text-2xl'} font-bold truncate text-foreground transition-all duration-500`}>
                {timer.title}
              </h2>
              {timer.category && (
                <div className={`${isFocusMode ? 'text-lg' : 'text-sm'} text-primary/80 flex items-center justify-center md:justify-start gap-2 transition-all truncate`}>
                  <span className={`shrink-0 ${isFocusMode ? 'w-3 h-3' : 'w-2 h-2'} rounded-full`} style={{ backgroundColor: timer.category.color || 'var(--color-primary)' }} />
                  <span className="truncate">{timer.category.name}</span>
                </div>
              )}
            </motion.div>

            {/* Time Display */}
            <motion.div layout className={`shrink-0 font-mono ${isFocusMode ? 'text-7xl md:text-9xl tracking-tighter' : 'text-5xl tracking-tight'} font-light neon-text flex items-center justify-center transition-all duration-500`}>
              {formatDuration(elapsedSeconds)}
            </motion.div>

            {/* Actions */}
            <motion.div layout className={`shrink-0 flex items-center gap-4 ${isFocusMode ? 'mt-8 md:mt-0 flex-col md:flex-row' : ''}`}>
              {isRunning ? (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`${isFocusMode ? 'h-20 w-20' : 'h-12 w-12'} rounded-full border-primary/50 text-primary hover:bg-primary/20 hover:text-white transition-all`}
                    onClick={handlePause}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Pause className={`${isFocusMode ? 'w-8 h-8' : 'w-5 h-5'}`} fill="currentColor" />}
                  </Button>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`${isFocusMode ? 'h-20 w-20' : 'h-12 w-12'} rounded-full border-green-500/50 text-green-500 hover:bg-green-500/20 hover:text-white transition-all`}
                    onClick={handleResume}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className={`${isFocusMode ? 'w-8 h-8' : 'w-5 h-5'}`} fill="currentColor" />}
                  </Button>
                </motion.div>
              )}

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={`${isFocusMode ? 'h-20 w-20' : 'h-12 w-12'} rounded-full border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all`}
                  onClick={handleStop}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Square className={`${isFocusMode ? 'w-8 h-8' : 'w-5 h-5'}`} fill="currentColor" />}
                </Button>
              </motion.div>

              {isPaused && (
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`${isFocusMode ? 'h-12 w-12' : 'h-10 w-10'} rounded-full text-muted-foreground hover:text-destructive`}
                    onClick={handleCancel}
                    disabled={isPending}
                    title="Cancel Timer"
                  >
                    <X className="w-5 h-5" />
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
