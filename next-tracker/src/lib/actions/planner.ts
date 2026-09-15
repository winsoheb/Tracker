"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { startOfDay, endOfDay, addDays } from "date-fns"

async function getUserId() {
  const user = await prisma.user.findFirst()
  if (!user) throw new Error("No user found")
  return user.id
}

export async function getScheduledTasks(date: Date) {
  const userId = await getUserId()
  const start = startOfDay(date)
  const end = endOfDay(date)

  return await prisma.scheduledTask.findMany({
    where: {
      userId,
      startAt: {
        gte: start,
        lte: end
      }
    },
    include: {
      category: true,
      project: true
    },
    orderBy: {
      startAt: "asc"
    }
  })
}

export async function createScheduledTask(data: {
  title: string
  description?: string
  startAt: Date
  endAt: Date
  estimatedMinutes: number
  categoryId?: string
  projectId?: string
  priority?: string
}) {
  const userId = await getUserId()
  
  const task = await prisma.scheduledTask.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      startAt: data.startAt,
      endAt: data.endAt,
      estimatedMinutes: data.estimatedMinutes,
      categoryId: data.categoryId,
      projectId: data.projectId,
      priority: data.priority || "MEDIUM",
      status: "PLANNED"
    }
  })

  revalidatePath("/planner")
  return task
}

export async function updateScheduledTaskTime(taskId: string, startAt: Date, endAt: Date) {
  const userId = await getUserId()
  
  const task = await prisma.scheduledTask.update({
    where: { id: taskId, userId },
    data: {
      startAt,
      endAt
    }
  })

  revalidatePath("/planner")
  return task
}

export async function updateScheduledTaskStatus(taskId: string, status: string) {
  const userId = await getUserId()
  
  const task = await prisma.scheduledTask.update({
    where: { id: taskId, userId },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null
    }
  })

  revalidatePath("/planner")
  return task
}

export async function deleteScheduledTask(taskId: string) {
  const userId = await getUserId()
  
  await prisma.scheduledTask.delete({
    where: { id: taskId, userId }
  })

  revalidatePath("/planner")
  return true
}
