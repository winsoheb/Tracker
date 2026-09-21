"use client"

import { Activity, Clock } from "lucide-react"

type ActiveTimer = {
  id: string
  title: string
  startedAt: Date
  user: {
    name: string
    avatar: string | null
  }
  task: {
    title: string
    priority: string
  } | null
}

export function TeamWorkloadWidget({ activeTimers }: { activeTimers: ActiveTimer[] }) {
  if (activeTimers.length === 0) {
    return (
      <div className="bg-background/40 backdrop-blur-3xl border border-white/5 p-6 rounded-3xl h-full flex flex-col items-center justify-center min-h-[300px]">
        <Clock className="w-8 h-8 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground text-sm font-medium">No team members are currently working</p>
      </div>
    )
  }

  return (
    <div className="bg-background/40 backdrop-blur-3xl border border-white/5 p-6 rounded-3xl h-full shadow-[0_0_40px_-10px_rgba(0,0,0,0.3)] relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

      <h2 className="text-lg font-medium flex items-center gap-2 mb-6 text-foreground/80">
        <Activity className="w-5 h-5 text-primary" />
        Live Workload
      </h2>

      <div className="space-y-4">
        {activeTimers.map((timer) => (
          <div key={timer.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                {timer.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate text-white">{timer.user.name}</p>
                <p className="text-xs text-primary font-medium truncate mt-0.5">
                  Working on: {timer.task ? timer.task.title : timer.title}
                </p>
                {timer.task?.priority && (
                  <span className="inline-flex items-center px-2 py-0.5 mt-2 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-primary/20 text-primary border border-primary/30">
                    {timer.task.priority}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
