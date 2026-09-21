"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { startOfDay, endOfDay, addDays } from "date-fns"

import { requireAuth, canManageUser, canModifyTask } from "@/lib/auth-utils"
import { generateOccurrenceDates } from "@/lib/recurrence-engine"

export async function getScheduledTasks(startDate: Date, endDate: Date, targetUserId?: string) {
  const currentUser = await requireAuth()
  
  let queryUserId = currentUser.id
  
  if (targetUserId && targetUserId !== currentUser.id) {
    const isAuthorized = await canManageUser(currentUser, targetUserId)
    if (!isAuthorized) {
      throw new Error("Forbidden: You do not have permission to view this user's planner.")
    }
    queryUserId = targetUserId
  }

  const start = startOfDay(startDate)
  const end = endOfDay(endDate)

  // 1. Fetch active recurrences for this user
  const recurrences = await prisma.taskRecurrence.findMany({
    where: {
      tasks: {
        some: { userId: queryUserId, isBlueprint: true }
      }
    },
    include: {
      tasks: {
        where: { userId: queryUserId, isBlueprint: true },
        take: 1,
        include: { reminders: true }
      }
    }
  })

  // 2. Generate missing occurrences lazily
  for (const recurrence of recurrences) {
    // If the recurrence ends before this date, or starts after this date, skip
    // (Actually rrule.between handles this, we just need to pass the date range)
    const blueprint = recurrence.tasks[0]
    if (!blueprint) continue

    const expectedDates = generateOccurrenceDates(recurrence, start, end)
    
    for (const expectedDate of expectedDates) {
      // Check if an occurrence (or a skipped exception) already exists for this date
      const existing = await prisma.task.findFirst({
        where: {
          recurrenceId: recurrence.id,
          userId: queryUserId,
          originalStartAt: expectedDate
        }
      })

      if (!existing) {
        // Calculate original duration
        const durationMs = blueprint.endAt && blueprint.startAt 
          ? blueprint.endAt.getTime() - blueprint.startAt.getTime() 
          : (blueprint.estimatedMinutes || 60) * 60000;

        const newEndAt = new Date(expectedDate.getTime() + durationMs)

        // Materialize the occurrence
        await prisma.task.create({
          data: {
            userId: queryUserId,
            title: blueprint.title,
            description: blueprint.description,
            startAt: expectedDate,
            endAt: newEndAt,
            originalStartAt: expectedDate,
            estimatedMinutes: blueprint.estimatedMinutes,
            categoryId: blueprint.categoryId,
            projectId: blueprint.projectId,
            priority: blueprint.priority,
            status: "TODO",
            recurrenceId: recurrence.id,
            isBlueprint: false,
            reminders: blueprint.reminders && blueprint.reminders.length > 0 ? {
              create: blueprint.reminders.map(r => ({
                minutesBefore: r.minutesBefore,
                channel: r.channel
              }))
            } : undefined
          }
        })
      }
    }
  }

  // 3. Fetch all materialized tasks for this day
  return await prisma.task.findMany({
    where: {
      userId: queryUserId,
      startAt: {
        gte: start,
        lte: end
      },
      isBlueprint: false, // Don't show pure blueprints on the timeline unless they happen to fall on this day... wait, blueprints shouldn't be shown unless they are occurrences too.
      isSkipped: false
    },
    include: {
      category: true,
      project: true,
      reminders: true
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
  assignedUserId?: string
  recurrence?: any
  reminderMinutes?: number
}) {
  const currentUser = await requireAuth()
  
  let targetUserId = currentUser.id
  
  if (data.assignedUserId && data.assignedUserId !== currentUser.id) {
    const isAuthorized = await canManageUser(currentUser, data.assignedUserId)
    if (!isAuthorized) {
      throw new Error("Forbidden: Cannot assign tasks to unauthorized users.")
    }
    targetUserId = data.assignedUserId
  }

  // If recurrence is provided, create the recurrence record first
  let recurrenceId = undefined
  let isBlueprint = false

  if (data.recurrence) {
    const rec = await prisma.taskRecurrence.create({
      data: {
        frequency: data.recurrence.frequency,
        interval: data.recurrence.interval || 1,
        daysOfWeek: data.recurrence.daysOfWeek ? JSON.stringify(data.recurrence.daysOfWeek) : null,
        dayOfMonth: data.recurrence.dayOfMonth,
        monthOfYear: data.recurrence.monthOfYear,
        occurrenceIndex: data.recurrence.occurrenceIndex,
        endType: data.recurrence.endType || "NEVER",
        endDate: data.recurrence.endDate,
        occurrenceCount: data.recurrence.occurrenceCount,
        startDate: data.startAt
      }
    })
    recurrenceId = rec.id
    isBlueprint = true
  }

  const task = await prisma.task.create({
    data: {
      userId: targetUserId,
      title: data.title,
      description: data.description,
      startAt: data.startAt,
      endAt: data.endAt,
      estimatedMinutes: data.estimatedMinutes,
      categoryId: data.categoryId,
      projectId: data.projectId,
      priority: data.priority || "MEDIUM",
      status: "TODO",
      recurrenceId,
      isBlueprint,
      originalStartAt: isBlueprint ? null : data.startAt, // Non-blueprint tasks have originalStartAt = startAt unless generated lazily
      reminders: data.reminderMinutes !== undefined ? {
        create: {
          minutesBefore: data.reminderMinutes
        }
      } : undefined
    }
  })

  // We should revalidate planner page
  revalidatePath("/planner")
  return task
}

export async function updateScheduledTaskTime(
  taskId: string, 
  startAt: Date, 
  endAt: Date, 
  mode: "THIS_TASK" | "THIS_AND_FUTURE" | "ALL_TASKS" = "THIS_TASK"
) {
  const currentUser = await requireAuth()
  
  const isAuthorized = await canModifyTask(currentUser, taskId)
  if (!isAuthorized) {
    throw new Error("Forbidden: You do not have permission to modify this task.")
  }

  const task = await prisma.task.findUnique({ 
    where: { id: taskId },
    include: { recurrence: true }
  })
  
  if (!task) throw new Error("Task not found")

  if (!task.recurrenceId || mode === "THIS_TASK") {
    // Standard update
    await prisma.task.update({
      where: { id: taskId },
      data: { startAt, endAt }
    })
  } else if (mode === "THIS_AND_FUTURE" && task.recurrence) {
    // 1. Cap the old recurrence
    const cutoffDate = new Date(task.originalStartAt || task.startAt!)
    await prisma.taskRecurrence.update({
      where: { id: task.recurrenceId },
      data: { 
        endType: "ON_DATE",
        endDate: new Date(cutoffDate.getTime() - 1000) 
      }
    })

    // 2. Create new recurrence
    const newRec = await prisma.taskRecurrence.create({
      data: {
        frequency: task.recurrence.frequency,
        interval: task.recurrence.interval,
        daysOfWeek: task.recurrence.daysOfWeek,
        dayOfMonth: task.recurrence.dayOfMonth,
        monthOfYear: task.recurrence.monthOfYear,
        occurrenceIndex: task.recurrence.occurrenceIndex,
        endType: task.recurrence.endType,
        endDate: task.recurrence.endDate,
        occurrenceCount: task.recurrence.occurrenceCount,
        startDate: startAt
      }
    })

    // 3. Create new blueprint
    await prisma.task.create({
      data: {
        userId: task.userId,
        title: task.title,
        description: task.description,
        startAt: startAt,
        endAt: endAt,
        estimatedMinutes: task.estimatedMinutes,
        categoryId: task.categoryId,
        projectId: task.projectId,
        priority: task.priority,
        status: "TODO",
        recurrenceId: newRec.id,
        isBlueprint: true
      }
    })

    // 4. Delete future uncompleted occurrences of the old recurrence
    await prisma.task.deleteMany({
      where: {
        recurrenceId: task.recurrenceId,
        isBlueprint: false,
        status: { not: "COMPLETED" },
        originalStartAt: { gte: cutoffDate }
      }
    })

  } else if (mode === "ALL_TASKS" && task.recurrenceId) {
    // 1. Update the blueprint's time
    const blueprint = await prisma.task.findFirst({
      where: { recurrenceId: task.recurrenceId, isBlueprint: true }
    })

    if (blueprint) {
      // Keep the blueprint's original date, but update the time
      const newBlueprintStart = new Date(blueprint.startAt!)
      newBlueprintStart.setHours(startAt.getHours(), startAt.getMinutes(), 0, 0)
      
      const durationMs = endAt.getTime() - startAt.getTime()
      const newBlueprintEnd = new Date(newBlueprintStart.getTime() + durationMs)

      await prisma.task.update({
        where: { id: blueprint.id },
        data: { startAt: newBlueprintStart, endAt: newBlueprintEnd }
      })
    }

    // 2. Delete all future uncompleted occurrences so they regenerate with new times
    await prisma.task.deleteMany({
      where: {
        recurrenceId: task.recurrenceId,
        isBlueprint: false,
        status: { not: "COMPLETED" },
        originalStartAt: { gt: new Date() } // Regenerate from tomorrow onwards, or from now
      }
    })
    
    // 3. Also update the current task directly since it might be today
    await prisma.task.update({
      where: { id: taskId },
      data: { startAt, endAt }
    })
  }

  revalidatePath("/planner")
  return true
}

export async function updateScheduledTaskStatus(taskId: string, status: string, statusReason?: string) {
  const currentUser = await requireAuth()
  
  const isAuthorized = await canModifyTask(currentUser, taskId)
  if (!isAuthorized) {
    throw new Error("Forbidden: You do not have permission to modify this task.")
  }

  // Get the task before updating
  const existingTask = await prisma.task.findUnique({
    where: { id: taskId }
  })
  if (!existingTask) throw new Error("Task not found")
  
  // Link Timer Logic
  if (status === "IN_PROGRESS" && existingTask.status !== "IN_PROGRESS") {
    const activeTimer = await prisma.runningTimer.findFirst({
      where: { userId: existingTask.userId, taskId: taskId }
    });
    if (!activeTimer) {
      // NOTE: We should start the timer for the task owner, not the current user if manager is acting
      await prisma.runningTimer.create({
        data: {
          userId: existingTask.userId,
          title: existingTask.title,
          categoryId: existingTask.categoryId,
          projectId: existingTask.projectId,
          description: existingTask.description || "",
          taskId: taskId,
          startedAt: new Date(),
          accumulatedDuration: 0,
        }
      })
    }
  } else if (status === "COMPLETED" && existingTask.status !== "COMPLETED") {
    const activeTimer = await prisma.runningTimer.findFirst({
      where: { userId: existingTask.userId, taskId: taskId }
    });
    if (activeTimer) {
      // stopTimer uses getUserId() which might be the manager.
      // It's safer to just replicate stopTimer logic here for the specific user's timer.
      const now = new Date()
      let finalDuration = activeTimer.accumulatedDuration
      if (!activeTimer.pausedAt) {
        const sessionDuration = Math.floor((now.getTime() - activeTimer.startedAt.getTime()) / 1000)
        finalDuration += sessionDuration
      }
      
      await prisma.$transaction(async (tx) => {
        const entry = await tx.timeEntry.create({
          data: {
            userId: activeTimer.userId,
            title: activeTimer.title,
            categoryId: activeTimer.categoryId,
            projectId: activeTimer.projectId,
            description: activeTimer.description,
            taskId: activeTimer.taskId,
            startedAt: activeTimer.createdAt, 
            endedAt: now,
            duration: finalDuration,
            source: "TIMER",
          }
        })
        await tx.runningTimer.delete({ where: { id: activeTimer.id } })
      })
    }
  }
  
  const data: any = { status, statusReason: statusReason || null }
  if (status === "COMPLETED") {
    data.completedAt = new Date()
  } else {
    data.completedAt = null
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data
  })
  
  revalidatePath("/planner")
  revalidatePath("/dashboard")
  return updatedTask
}

export async function deleteScheduledTask(
  taskId: string,
  mode: "THIS_TASK" | "THIS_AND_FUTURE" | "ALL_TASKS" = "THIS_TASK"
) {
  const currentUser = await requireAuth()
  
  const isAuthorized = await canModifyTask(currentUser, taskId)
  if (!isAuthorized) {
    throw new Error("Forbidden: You do not have permission to delete this task.")
  }

  const task = await prisma.task.findUnique({ 
    where: { id: taskId },
    include: { recurrence: true }
  })
  if (!task) throw new Error("Task not found")

  if (!task.recurrenceId || mode === "THIS_TASK") {
    if (task.recurrenceId) {
      // It's part of a recurrence. Mark as skipped so it doesn't regenerate.
      await prisma.task.update({
        where: { id: taskId },
        data: { isSkipped: true }
      })
    } else {
      // Normal one-off task
      await prisma.task.delete({
        where: { id: taskId }
      })
    }
  } else if (mode === "THIS_AND_FUTURE") {
    const cutoffDate = new Date(task.originalStartAt || task.startAt!)
    
    // Cap recurrence
    await prisma.taskRecurrence.update({
      where: { id: task.recurrenceId },
      data: { 
        endType: "ON_DATE",
        endDate: new Date(cutoffDate.getTime() - 1000)
      }
    })

    // Delete future uncompleted occurrences including this one
    await prisma.task.deleteMany({
      where: {
        recurrenceId: task.recurrenceId,
        isBlueprint: false,
        status: { not: "COMPLETED" },
        originalStartAt: { gte: cutoffDate }
      }
    })
  } else if (mode === "ALL_TASKS") {
    // End the recurrence immediately so no future tasks generate
    await prisma.taskRecurrence.update({
      where: { id: task.recurrenceId },
      data: { endType: "ON_DATE", endDate: new Date() } // Or actually delete it if you want, but keeping it for history is safer
    })
    
    // Delete blueprint
    await prisma.task.deleteMany({
      where: { recurrenceId: task.recurrenceId, isBlueprint: true }
    })

    // Delete all uncompleted occurrences past, present, and future
    await prisma.task.deleteMany({
      where: {
        recurrenceId: task.recurrenceId,
        isBlueprint: false,
        status: { not: "COMPLETED" }
      }
    })
  }

  revalidatePath("/planner")
  return true
}
