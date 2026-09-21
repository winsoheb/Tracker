"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth-utils"

// Use session user instead of first user
async function getUserId() {
  const user = await requireAuth()
  return user.id
}

export async function getActiveTimers() {
  const userId = await getUserId()
  return await prisma.runningTimer.findMany({
    where: { userId },
    include: {
      category: true,
      project: true,
    },
    orderBy: { startedAt: 'asc' }
  })
}

export async function startTimer(data: { title: string, categoryId?: string | null, projectId?: string | null, description?: string, taskId?: string | null }) {
  const userId = await getUserId()

  const timer = await prisma.runningTimer.create({
    data: {
      userId,
      title: data.title || "Untitled Task",
      categoryId: data.categoryId || null,
      projectId: data.projectId || null,
      description: data.description || "",
      taskId: data.taskId || null,
      startedAt: new Date(),
      accumulatedDuration: 0,
    }
  })

  revalidatePath("/")
  return timer
}

export async function pauseTimer(timerId: string) {
  const userId = await getUserId()
  
  const timer = await prisma.runningTimer.findUnique({
    where: { id: timerId, userId }
  })

  if (!timer || timer.pausedAt) return timer

  const now = new Date()
  const sessionDuration = Math.floor((now.getTime() - timer.startedAt.getTime()) / 1000)
  
  const updatedTimer = await prisma.runningTimer.update({
    where: { id: timerId, userId },
    data: {
      pausedAt: now,
      accumulatedDuration: timer.accumulatedDuration + sessionDuration
    }
  })

  revalidatePath("/")
  return updatedTimer
}

export async function resumeTimer(timerId: string) {
  const userId = await getUserId()

  const timer = await prisma.runningTimer.findUnique({
    where: { id: timerId, userId }
  })

  if (!timer || !timer.pausedAt) return timer

  const updatedTimer = await prisma.runningTimer.update({
    where: { id: timerId, userId },
    data: {
      startedAt: new Date(),
      pausedAt: null
    }
  })

  revalidatePath("/")
  return updatedTimer
}

export async function stopTimer(timerId: string) {
  const userId = await getUserId()

  const timer = await prisma.runningTimer.findUnique({
    where: { id: timerId, userId }
  })

  if (!timer) return null

  const now = new Date()
  
  // Calculate final duration
  let finalDuration = timer.accumulatedDuration
  if (!timer.pausedAt) {
    const sessionDuration = Math.floor((now.getTime() - timer.startedAt.getTime()) / 1000)
    finalDuration += sessionDuration
  }

  const result = await prisma.$transaction(async (tx) => {
    const entry = await tx.timeEntry.create({
      data: {
        userId: timer.userId,
        title: timer.title,
        categoryId: timer.categoryId,
        projectId: timer.projectId,
        description: timer.description,
        taskId: timer.taskId,
        startedAt: timer.createdAt, 
        endedAt: now,
        duration: finalDuration,
        source: "TIMER",
      }
    })

    await tx.runningTimer.delete({ where: { id: timer.id } })

    await tx.activityEvent.create({
      data: {
        userId,
        type: "Create",
        entity: "TimeEntry",
        entityId: entry.id,
        details: `Completed task: ${entry.title} (${Math.round(entry.duration / 60)} mins)`
      }
    })

    return entry
  })

  revalidatePath("/")
  revalidatePath("/reports")
  return result
}

export async function cancelTimer(timerId: string) {
  const userId = await getUserId()
  
  await prisma.runningTimer.delete({
    where: { id: timerId, userId }
  }).catch(() => {}) // Ignore if doesn't exist

  revalidatePath("/")
  return true
}

export async function createManualTimeEntry(data: {
  title: string
  categoryId?: string | null
  projectId?: string | null
  description?: string
  startedAt: Date
  endedAt: Date
}) {
  const userId = await getUserId()
  const duration = Math.floor((data.endedAt.getTime() - data.startedAt.getTime()) / 1000)

  if (duration <= 0) {
    throw new Error("End time must be after start time")
  }

  const result = await prisma.$transaction(async (tx) => {
    const entry = await tx.timeEntry.create({
      data: {
        userId,
        title: data.title || "Manual Entry",
        categoryId: data.categoryId || null,
        projectId: data.projectId || null,
        description: data.description || "",
        startedAt: data.startedAt,
        endedAt: data.endedAt,
        duration,
        source: "MANUAL",
      }
    })

    await tx.activityEvent.create({
      data: {
        userId,
        type: "Create",
        entity: "TimeEntry",
        entityId: entry.id,
        details: `Manually logged task: ${entry.title} (${Math.round(entry.duration / 60)} mins)`
      }
    })

    return entry
  })

  revalidatePath("/reports")
  revalidatePath("/")
  return result
}

export async function updateTimeEntry(id: string, data: {
  title: string
  categoryId?: string | null
  projectId?: string | null
  startedAt: Date
  endedAt: Date
}) {
  const userId = await getUserId()
  const duration = Math.floor((data.endedAt.getTime() - data.startedAt.getTime()) / 1000)

  if (duration <= 0) {
    throw new Error("End time must be after start time")
  }

  const result = await prisma.timeEntry.update({
    where: { id, userId },
    data: {
      title: data.title,
      categoryId: data.categoryId || null,
      projectId: data.projectId || null,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
      duration,
    }
  })

  revalidatePath("/reports")
  revalidatePath("/")
  return result
}

export async function deleteTimeEntry(id: string) {
  const userId = await getUserId()

  await prisma.timeEntry.delete({
    where: { id, userId }
  })

  revalidatePath("/reports")
  revalidatePath("/")
  return true
}
