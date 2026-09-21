"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

export type NotificationAlert = {
  id: string
  title: string
  message: string
  type: "UPCOMING" | "OVERDUE"
  time: Date
}

export async function getNotifications(): Promise<NotificationAlert[]> {
  const user = await requireAuth()
  
  const now = new Date()
  
  // Calculate window for upcoming tasks (next 30 minutes)
  const upcomingWindow = new Date(now.getTime() + 30 * 60000)
  
  // Calculate window for overdue tasks (past 24 hours)
  const overdueWindow = new Date(now.getTime() - 24 * 60 * 60000)

  const tasks = await prisma.task.findMany({
    where: {
      userId: user.id,
      status: { notIn: ["COMPLETED", "CANCELLED"] },
      OR: [
        {
          // Upcoming
          startAt: {
            gte: now,
            lte: upcomingWindow
          }
        },
        {
          // Overdue
          endAt: {
            gte: overdueWindow,
            lte: now
          }
        }
      ]
    },
    select: {
      id: true,
      title: true,
      startAt: true,
      endAt: true
    }
  })

  const alerts: NotificationAlert[] = []

  for (const task of tasks) {
    if (task.startAt && task.startAt > now) {
      alerts.push({
        id: `upcoming-${task.id}`,
        title: "Upcoming Task",
        message: `"${task.title}" is starting soon.`,
        type: "UPCOMING",
        time: task.startAt
      })
    } else if (task.endAt && task.endAt < now) {
      alerts.push({
        id: `overdue-${task.id}`,
        title: "Overdue Task",
        message: `"${task.title}" was scheduled to end.`,
        type: "OVERDUE",
        time: task.endAt
      })
    }
  }

  // Sort by time descending
  return alerts.sort((a, b) => b.time.getTime() - a.time.getTime())
}
