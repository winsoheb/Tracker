"use client"

import * as React from "react"
import {
  CalendarDays,
  Clock,
  LayoutDashboard,
  Settings,
  BarChart3,
  ListTodo
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Planner", url: "/planner", icon: CalendarDays },
  { title: "Activity", url: "/activity", icon: ListTodo },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-white/5 bg-background/40 backdrop-blur-3xl">
      <SidebarHeader className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Clock className="w-7 h-7 text-primary drop-shadow-[0_0_8px_rgba(147,51,234,0.5)]" />
          <span className="font-bold text-xl tracking-[0.2em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">Tracker</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 mt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 uppercase tracking-widest text-xs mb-2">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} className="hover:bg-primary/20 hover:text-white transition-all duration-300 rounded-lg py-5 px-4 text-muted-foreground" onClick={() => window.location.href = item.url}>
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="font-medium tracking-wide text-sm">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
      </SidebarFooter>
    </Sidebar>
  )
}
