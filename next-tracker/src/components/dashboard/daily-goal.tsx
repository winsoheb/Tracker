"use client"

import React from "react"
import { motion } from "framer-motion"

type DailyGoalProps = {
  todaysTotalSeconds: number
  dailyGoalSeconds: number
}

export function DailyGoal({ todaysTotalSeconds, dailyGoalSeconds }: DailyGoalProps) {
  const progress = Math.min(todaysTotalSeconds / dailyGoalSeconds, 1)
  const percentage = Math.round(progress * 100)
  const hours = (todaysTotalSeconds / 3600).toFixed(1)
  const goalHours = dailyGoalSeconds / 3600

  // SVG circle properties
  const size = 160
  const strokeWidth = 8
  const center = size / 2
  const radius = center - strokeWidth
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - progress * circumference

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Background circle */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle 
            cx={center} 
            cy={center} 
            r={radius} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth={strokeWidth} 
            className="text-white/5" 
          />
          {/* Foreground animated circle */}
          <motion.circle 
            cx={center} 
            cy={center} 
            r={radius} 
            fill="none" 
            stroke="hsl(var(--primary))" 
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="drop-shadow-[0_0_10px_rgba(147,51,234,0.5)]"
          />
        </svg>
        
        <div className="text-center z-10 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-light neon-text"
          >
            {hours}<span className="text-lg text-muted-foreground ml-1">h</span>
          </motion.div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
            {percentage}% completed
          </div>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground/80">
        of <strong className="text-foreground">{goalHours} hours</strong> goal
      </p>
    </div>
  )
}
