"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"

export function SignOutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <Button 
      variant="outline" 
      className="gap-2 w-32"
      onClick={handleSignOut}
      disabled={isSigningOut}
    >
      {isSigningOut ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      {isSigningOut ? "Signing out..." : "Sign Out"}
    </Button>
  )
}
