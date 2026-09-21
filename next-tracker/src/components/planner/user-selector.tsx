"use client"

import React from "react"
import { useRouter } from "next/navigation"

export function UserSelector({ 
  teamMembers, 
  targetUserId, 
  currentDateStr,
  currentViewStr
}: { 
  teamMembers: any[], 
  targetUserId: string, 
  currentDateStr: string,
  currentViewStr?: string
}) {
  const router = useRouter()

  if (teamMembers.length === 0) return null

  return (
    <div className="flex items-center gap-2 mr-2">
      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-xs">View Planner For:</span>
      <select 
        className="bg-white/5 border border-white/10 rounded-lg h-9 px-3 text-sm focus:ring-primary/50 text-foreground cursor-pointer appearance-none"
        value={targetUserId}
        onChange={(e) => {
          const dateParam = currentDateStr ? `&date=${currentDateStr}` : ''
          const viewParam = currentViewStr && currentViewStr !== 'daily' ? `&view=${currentViewStr}` : ''
          window.location.href = `/planner?user=${e.target.value}${dateParam}${viewParam}`
        }}
      >
        {teamMembers.map(member => (
          <option key={member.id} value={member.id} className="bg-background text-foreground">
            {member.name} {member.email ? `(${member.email})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
