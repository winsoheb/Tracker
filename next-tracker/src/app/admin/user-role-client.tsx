"use client"

import { useState } from "react"
import { updateUserRole } from "@/lib/actions/admin"
import { Loader2 } from "lucide-react"

export function UserRoleClient({ userId, currentRole }: { userId: string, currentRole: string }) {
  const [isPending, setIsPending] = useState(false)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value
    if (newRole === currentRole) return

    setIsPending(true)
    try {
      await updateUserRole(userId, newRole)
    } catch (err: any) {
      alert("Failed to update role: " + err.message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="relative inline-block w-40">
      <select
        value={currentRole}
        onChange={handleChange}
        disabled={isPending}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
      >
        <option value="EMPLOYEE" className="bg-background text-foreground">EMPLOYEE</option>
        <option value="MANAGER" className="bg-background text-foreground">MANAGER</option>
        <option value="ADMIN" className="bg-background text-foreground">ADMIN</option>
      </select>
      {isPending && (
        <Loader2 className="w-4 h-4 text-primary absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
      )}
    </div>
  )
}
