import React from "react"
import { getActivityLogs } from "@/lib/actions/activity"
import { formatDistanceToNow } from "date-fns"
import { Activity, Clock, CheckCircle, PlusCircle, Trash2, Edit } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

const getIconForType = (type: string, entity: string) => {
  if (type === "Create") {
    if (entity === "TimeEntry") return <Clock className="w-4 h-4 text-emerald-400" />
    return <PlusCircle className="w-4 h-4 text-blue-400" />
  }
  if (type === "Update") return <Edit className="w-4 h-4 text-amber-400" />
  if (type === "Delete") return <Trash2 className="w-4 h-4 text-rose-400" />
  return <Activity className="w-4 h-4 text-muted-foreground" />
}

export default async function ActivityPage() {
  const logs = await getActivityLogs()

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto py-8">
      <header>
        <h1 className="text-3xl font-light tracking-tight mb-2">
          Activity & Logs
        </h1>
        <p className="text-muted-foreground tracking-wide">
          An audit trail of your system-wide actions.
        </p>
      </header>

      <div className="glass rounded-2xl p-6 shadow-2xl min-h-[500px]">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50 border border-dashed border-white/5 rounded-xl py-20">
            <Activity className="w-8 h-8 mb-4 opacity-20" />
            No activity recorded yet.
          </div>
        ) : (
          <div className="relative border-l border-white/10 ml-3 space-y-8 pb-4">
            {logs.map((log, idx) => (
              <div key={log.id} className="relative pl-6">
                <span className="absolute -left-3.5 top-1 bg-background border border-white/10 w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                  {getIconForType(log.type, log.entity)}
                </span>
                
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {log.type} {log.entity}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-sm text-muted-foreground/80 bg-white/5 inline-block px-3 py-2 rounded-lg border border-white/5 w-fit mt-1">
                      {log.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
