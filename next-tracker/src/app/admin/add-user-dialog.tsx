"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserPlus, Loader2 } from "lucide-react"
import { createUserManual } from "@/lib/actions/admin"

export function AddUserDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("EMPLOYEE")

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    
    try {
      await createUserManual({
        name,
        email,
        password,
        role
      })
      setOpen(false)
      setName("")
      setEmail("")
      setPassword("")
      setRole("EMPLOYEE")
    } catch (e: any) {
      alert("Failed to create user: " + e.message)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:from-primary/90 hover:to-primary transition-all duration-300 text-primary-foreground h-8 gap-1.5 px-2.5 text-sm font-medium outline-none`}
      >
        <UserPlus className="w-4 h-4 mr-2" /> Add User
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-white/10 bg-background/40 backdrop-blur-2xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-tight">
            Add New User
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Full Name</label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              required
              className="bg-white/5 border-white/10 focus-visible:ring-primary/50"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Email Address</label>
            <Input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              required
              className="bg-white/5 border-white/10 focus-visible:ring-primary/50"
              placeholder="john@company.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Password (Optional)</label>
            <Input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              className="bg-white/5 border-white/10 focus-visible:ring-primary/50"
              placeholder="Leave blank for 'password123'"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isPending}
              className="w-full bg-white/5 border-white/10 focus-visible:ring-primary/50 transition-all rounded-xl h-10 px-3 text-sm text-foreground appearance-none cursor-pointer"
            >
              <option value="EMPLOYEE" className="bg-background">Employee</option>
              <option value="MANAGER" className="bg-background">Manager</option>
              <option value="ADMIN" className="bg-background">Admin</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending || !name || !email}
              className="rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
