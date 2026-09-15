"use client"

import * as React from "react"
import {
  CalendarDays,
  Settings,
  LayoutDashboard,
  BarChart3,
  ListTodo
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Toggle palette on Ctrl/Cmd + K
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      
      // Global shortcuts only if we're not in an input
      if (!open && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        switch(e.key.toLowerCase()) {
          case 'd':
            window.location.href = "/";
            break;
          case 'p':
            window.location.href = "/planner";
            break;
          case 'r':
            window.location.href = "/reports";
            break;
          case 'l':
            window.location.href = "/activity";
            break;
        }
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search... (Ctrl+K)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => { setOpen(false); window.location.href = "/" }}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
            <CommandShortcut>D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => { setOpen(false); window.location.href = "/planner" }}>
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>Planner</span>
            <CommandShortcut>P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => { setOpen(false); window.location.href = "/reports" }}>
            <BarChart3 className="mr-2 h-4 w-4" />
            <span>Reports</span>
            <CommandShortcut>R</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => { setOpen(false); window.location.href = "/activity" }}>
            <ListTodo className="mr-2 h-4 w-4" />
            <span>Activity Logs</span>
            <CommandShortcut>L</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => { setOpen(false); window.location.href = "/settings" }}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
