"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  return (
    <Button 
      variant="outline" 
      className="gap-2"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      <LogOut className="w-4 h-4" /> Sign Out
    </Button>
  )
}
