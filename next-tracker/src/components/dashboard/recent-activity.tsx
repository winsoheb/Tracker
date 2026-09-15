"use client"

import React from "react"
import { motion } from "framer-motion"
import { formatDuration } from "@/lib/utils"

type RecentActivityProps = {
  entries: any[]
}

export function RecentActivity({ entries }: RecentActivityProps) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground/50 border border-dashed border-white/5 rounded-xl">
        No activity today. Start a timer!
      </div>
    )
  }

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
      {entries.map((entry, idx) => (
        <motion.div 
          key={entry.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{entry.title}</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {entry.category && (
                <span className="flex items-center gap-1 text-primary/80">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.category.color || 'var(--color-primary)' }} />
                  {entry.category.name}
                </span>
              )}
              {entry.project && (
                <>
                  <span className="text-white/20">•</span>
                  <span>{entry.project.name}</span>
                </>
              )}
            </div>
          </div>
          <div className="font-mono text-lg font-light">
            {formatDuration(entry.duration)}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
