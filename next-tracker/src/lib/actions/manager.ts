"use server"

import { prisma } from "@/lib/prisma"
import { requireManager } from "@/lib/auth-utils"

export async function getTeamWorkload() {
  const user = await requireManager()
  
  // 1. If admin, they can see everyone (or we could restrict it to departments)
  // 2. If manager, they can only see members of the teams they manage.
  
  let teamMemberIds: string[] = []

  if (user.role === "ADMIN") {
    // Admins see all users
    const allUsers = await prisma.user.findMany({ select: { id: true } })
    teamMemberIds = allUsers.map(u => u.id)
  } else {
    // Fetch teams where this user is a manager
    const managedTeams = await prisma.teamMember.findMany({
      where: {
        userId: user.id,
        isManager: true
      },
      select: { teamId: true }
    })

    const teamIds = managedTeams.map(t => t.teamId)

    // Fetch all members of those teams
    const members = await prisma.teamMember.findMany({
      where: {
        teamId: { in: teamIds }
      },
      select: { userId: true }
    })

    teamMemberIds = members.map(m => m.userId)
  }

  // Ensure unique
  teamMemberIds = Array.from(new Set(teamMemberIds))

  // Fetch active running timers for these users
  const activeTimers = await prisma.runningTimer.findMany({
    where: {
      userId: { in: teamMemberIds },
      pausedAt: null
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true }
      },
      task: {
        select: { id: true, title: true, priority: true }
      }
    },
    orderBy: {
      startedAt: "desc"
    }
  })

  // Fetch planned tasks for these users today
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  const plannedTasks = await prisma.task.findMany({
    where: {
      userId: { in: teamMemberIds },
      startAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    select: {
      id: true,
      userId: true,
      estimatedMinutes: true,
      status: true
    }
  })

  // Aggregate planned minutes vs completed minutes per user
  const workloadAggregation = teamMemberIds.map(userId => {
    const userTasks = plannedTasks.filter(t => t.userId === userId)
    const plannedMinutes = userTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0)
    const completedTasks = userTasks.filter(t => t.status === "COMPLETED")
    const completedMinutes = completedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0)
    
    return {
      userId,
      plannedMinutes,
      completedMinutes,
      activeTaskCount: userTasks.length
    }
  })

  return {
    activeTimers,
    workloadAggregation
  }
}
