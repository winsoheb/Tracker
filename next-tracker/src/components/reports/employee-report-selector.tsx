"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Users } from "lucide-react"

export function EmployeeReportSelector({ members }: { members: { id: string, name: string }[] }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setSelectedId(val)
    if (val) {
      router.push(`/manager/reports/team/${val}`)
    }
  }

  return (
    <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 h-10">
      <Users className="w-4 h-4 mr-2 text-muted-foreground" />
      <select 
        className="bg-transparent border-none text-sm outline-none w-36 text-foreground"
        value={selectedId}
        onChange={handleChange}
      >
        <option value="" disabled className="bg-slate-900 text-muted-foreground">Select Employee...</option>
        {members.map(m => (
          <option key={m.id} value={m.id} className="bg-slate-900 text-foreground">{m.name}</option>
        ))}
      </select>
    </div>
  )
}
