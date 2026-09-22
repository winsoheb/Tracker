"use client"

import * as React from "react"
import { useSession, signOut } from "next-auth/react"
import {
  CalendarDays,
  Clock,
  LayoutDashboard,
  Settings,
  BarChart3,
  ListTodo,
  ShieldCheck,
  LogOut
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
  { title: "Profile", url: "/profile", icon: UserCircle },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { data: session } = useSession()
  const isManager = session?.user?.role === "MANAGER" || session?.user?.role === "ADMIN"
  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <Sidebar className="border-r border-white/5 bg-background/40 backdrop-blur-3xl">
      <SidebarHeader className="p-6 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Clock className="w-7 h-7 text-primary drop-shadow-[0_0_8px_rgba(147,51,234,0.5)]" />
          <span className="font-bold text-xl tracking-[0.2em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">WorkOrbit</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 mt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 uppercase tracking-widest text-xs mb-2">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {isAdmin && (
                <SidebarMenuItem key="Admin">
                  <SidebarMenuButton tooltip="Administration" className="hover:bg-primary/20 hover:text-white transition-all duration-300 rounded-lg py-5 px-4 text-muted-foreground" onClick={() => window.location.href = "/admin"}>
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <span className="font-medium tracking-wide text-sm">Admin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {isManager && (
                <>
                  <SidebarMenuItem key="Manager">
                    <SidebarMenuButton tooltip="Manager Dashboard" className="hover:bg-primary/20 hover:text-white transition-all duration-300 rounded-lg py-5 px-4 text-muted-foreground" onClick={() => window.location.href = "/manager"}>
                      <LayoutDashboard className="w-5 h-5 text-primary" />
                      <span className="font-medium tracking-wide text-sm">Manager</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem key="TeamReports">
                    <SidebarMenuButton tooltip="Team Analytics" className="hover:bg-primary/20 hover:text-white transition-all duration-300 rounded-lg py-5 px-4 text-muted-foreground" onClick={() => window.location.href = "/manager/reports"}>
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <span className="font-medium tracking-wide text-sm">Team Reports</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
              {items.map((item) => {
                if (item.title === "Settings" && !isManager) return null;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton tooltip={item.title} className="hover:bg-primary/20 hover:text-white transition-all duration-300 rounded-lg py-5 px-4 text-muted-foreground" onClick={() => window.location.href = item.url}>
                      <item.icon className="w-5 h-5 text-primary" />
                      <span className="font-medium tracking-wide text-sm">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all font-medium text-sm border border-red-500/20"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </SidebarFooter>
    </Sidebar>
  )
}
