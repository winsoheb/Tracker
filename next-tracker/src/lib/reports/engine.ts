import { prisma } from "@/lib/prisma"
import { requireManager, getAllowedTeamMembers } from "@/lib/auth-utils"
import { startOfDay, endOfDay, differenceInBusinessDays } from "date-fns"

export type ReportFilter = {
  startDate: Date
  endDate: Date
  userId?: string
  teamId?: string
  projectId?: string
  categoryId?: string
}

/**
 * Ensures the currentUser is authorized, and returns an array of User IDs
 * that are permitted to be included in the report.
 */
export async function getAuthorizedUserIdsForReport(currentUser: any, filter: ReportFilter): Promise<string[]> {
  const allowedUserIds = await getAllowedTeamMembers(currentUser)
  
  if (currentUser.role === "ADMIN") {
    if (filter.userId) return [filter.userId]
    // Note: Admin logic might need expansion based on team filter
    return allowedUserIds
  }

  // MANAGER
  if (filter.userId) {
    if (!allowedUserIds.includes(filter.userId)) {
      throw new Error("Unauthorized to view reports for this user")
    }
    return [filter.userId]
  }

  return allowedUserIds
}

export async function getTeamPlannedVsActual(currentUser: any, filter: ReportFilter) {
  const userIds = await getAuthorizedUserIdsForReport(currentUser, filter)
  if (userIds.length === 0) return { plannedMinutes: 0, actualMinutes: 0, unplannedMinutes: 0 }

  // 1. Fetch all planned tasks
  const tasks = await prisma.task.findMany({
    where: {
      userId: { in: userIds },
      isBlueprint: false,
      startAt: { gte: filter.startDate },
      endAt: { lte: filter.endDate }
    },
    select: { id: true, estimatedMinutes: true, startAt: true, endAt: true }
  })

  let plannedMinutes = 0
  for (const t of tasks) {
    if (t.estimatedMinutes) {
      plannedMinutes += t.estimatedMinutes
    } else if (t.endAt && t.startAt) {
      plannedMinutes += Math.round((t.endAt.getTime() - t.startAt.getTime()) / 60000)
    }
  }

  // 2. Fetch all actual time entries
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId: { in: userIds },
      startedAt: { gte: filter.startDate, lte: filter.endDate }
    },
    select: { duration: true, taskId: true }
  })

  let actualMinutes = 0
  let unplannedMinutes = 0

  for (const entry of timeEntries) {
    const entryMinutes = Math.round(entry.duration / 60)
    actualMinutes += entryMinutes
    if (!entry.taskId) {
      unplannedMinutes += entryMinutes
    }
  }

  return {
    plannedMinutes,
    actualMinutes,
    unplannedMinutes,
    varianceMinutes: actualMinutes - plannedMinutes
  }
}

export async function getTeamTaskStats(currentUser: any, filter: ReportFilter) {
  const userIds = await getAuthorizedUserIdsForReport(currentUser, filter)
  if (userIds.length === 0) return { total: 0, completed: 0, inProgress: 0, blocked: 0, overdue: 0 }

  const tasks = await prisma.task.findMany({
    where: {
      userId: { in: userIds },
      isBlueprint: false,
      startAt: { gte: filter.startDate },
      endAt: { lte: filter.endDate }
    },
    select: { status: true, dueDate: true }
  })

  let completed = 0
  let inProgress = 0
  let blocked = 0
  let overdue = 0
  const now = new Date()

  for (const t of tasks) {
    if (t.status === "COMPLETED") completed++
    if (t.status === "IN_PROGRESS") inProgress++
    if (t.status === "BLOCKED") blocked++
    if (t.status !== "COMPLETED" && t.dueDate && t.dueDate < now) overdue++
  }

  return {
    total: tasks.length,
    completed,
    inProgress,
    blocked,
    overdue
  }
}

export async function getTeamWorkloadSummary(currentUser: any, filter: ReportFilter) {
  const userIds = await getAuthorizedUserIdsForReport(currentUser, filter)
  if (userIds.length === 0) return []

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  })

  // Get active tasks (TODO, IN_PROGRESS)
  const activeTasks = await prisma.task.groupBy({
    by: ['userId'],
    where: {
      userId: { in: userIds },
      isBlueprint: false,
      status: { in: ["TODO", "IN_PROGRESS"] }
    },
    _count: { id: true }
  })

  const taskCounts = Object.fromEntries(activeTasks.map(t => [t.userId, t._count.id]))

  // Get planned time for the specific period
  const tasks = await prisma.task.findMany({
    where: {
      userId: { in: userIds },
      isBlueprint: false,
      startAt: { gte: filter.startDate },
      endAt: { lte: filter.endDate }
    },
    select: { userId: true, estimatedMinutes: true, startAt: true, endAt: true }
  })

  const plannedMinutesMap: Record<string, number> = {}
  for (const t of tasks) {
    if (!plannedMinutesMap[t.userId]) plannedMinutesMap[t.userId] = 0
    if (t.estimatedMinutes) {
      plannedMinutesMap[t.userId] += t.estimatedMinutes
    } else if (t.endAt && t.startAt) {
      plannedMinutesMap[t.userId] += Math.round((t.endAt.getTime() - t.startAt.getTime()) / 60000)
    }
  }

  // Calculate Capacity (8 hours / day)
  // differenceInBusinessDays returns exact difference. If we want inclusive, add 1.
  const businessDays = Math.max(0, differenceInBusinessDays(filter.endDate, filter.startDate) + 1)
  const defaultCapacityMinutes = businessDays * 8 * 60

  return users.map(u => ({
    ...u,
    openTasks: taskCounts[u.id] || 0,
    plannedMinutes: plannedMinutesMap[u.id] || 0,
    availableCapacityMinutes: defaultCapacityMinutes,
    remainingCapacityMinutes: defaultCapacityMinutes - (plannedMinutesMap[u.id] || 0)
  })).sort((a, b) => b.plannedMinutes - a.plannedMinutes)
}

export async function getOverdueAndBlockedTasks(currentUser: any, filter: ReportFilter) {
  const userIds = await getAuthorizedUserIdsForReport(currentUser, filter)
  if (userIds.length === 0) return { overdue: [], blocked: [] }

  const now = new Date()

  const blocked = await prisma.task.findMany({
    where: {
      userId: { in: userIds },
      isBlueprint: false,
      status: "BLOCKED",
      startAt: { gte: filter.startDate },
      endAt: { lte: filter.endDate }
    },
    include: { user: { select: { name: true } }, project: { select: { name: true } } }
  })

  const overdue = await prisma.task.findMany({
    where: {
      userId: { in: userIds },
      isBlueprint: false,
      status: { not: "COMPLETED" },
      dueDate: { lt: now },
      startAt: { gte: filter.startDate },
      endAt: { lte: filter.endDate }
    },
    include: { user: { select: { name: true } }, project: { select: { name: true } } }
  })

  return { blocked, overdue }
}

export async function getTeamProjectStats(currentUser: any, filter: ReportFilter) {
  const userIds = await getAuthorizedUserIdsForReport(currentUser, filter)
  if (userIds.length === 0) return []

  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId: { in: userIds },
      startedAt: { gte: filter.startDate, lte: filter.endDate }
    },
    include: { project: { select: { id: true, name: true, status: true } } }
  })

  const projectMap: Record<string, { id: string, name: string, status: string, duration: number }> = {}
  let noProjectDuration = 0

  for (const entry of timeEntries) {
    if (entry.project) {
      const pid = entry.project.id
      if (!projectMap[pid]) {
        projectMap[pid] = { id: pid, name: entry.project.name, status: entry.project.status, duration: 0 }
      }
      projectMap[pid].duration += entry.duration
    } else {
      noProjectDuration += entry.duration
    }
  }

  const result = Object.values(projectMap)
    .map(p => ({ ...p, durationMinutes: Math.round(p.duration / 60) }))
    .sort((a, b) => b.durationMinutes - a.durationMinutes)

  if (noProjectDuration > 0) {
    result.push({
      id: "none",
      name: "No Project",
      status: "ACTIVE",
      durationMinutes: Math.round(noProjectDuration / 60)
    })
  }

  return result
}

export async function getTeamWorkloadTimeline(currentUser: any, filter: ReportFilter) {
  const userIds = await getAuthorizedUserIdsForReport(currentUser, filter)
  if (userIds.length === 0) return { users: [], timeline: {} }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true }
  })

  const tasks = await prisma.task.findMany({
    where: {
      userId: { in: userIds },
      isBlueprint: false,
      startAt: { gte: filter.startDate },
      endAt: { lte: filter.endDate }
    },
    select: { userId: true, startAt: true, endAt: true, estimatedMinutes: true }
  })

  // Group by User -> Date (YYYY-MM-DD) -> Total Planned Minutes
  const timeline: Record<string, Record<string, number>> = {}
  for (const u of users) {
    timeline[u.id] = {}
  }

  for (const t of tasks) {
    if (!t.startAt) continue
    
    // We attribute the planned time to the start day for the timeline
    const dateStr = t.startAt.toISOString().split("T")[0]
    
    let mins = 0
    if (t.estimatedMinutes) mins = t.estimatedMinutes
    else if (t.endAt) mins = Math.round((t.endAt.getTime() - t.startAt.getTime()) / 60000)

    if (mins > 0) {
      if (!timeline[t.userId][dateStr]) timeline[t.userId][dateStr] = 0
      timeline[t.userId][dateStr] += mins
    }
  }

  return { users, timeline }
}

export async function getNoPlanEmployees(currentUser: any, filter: ReportFilter) {
  const userIds = await getAuthorizedUserIdsForReport(currentUser, filter)
  if (userIds.length === 0) return []

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true }
  })

  // Find all users who HAVE a planned task in this period
  const usersWithPlans = await prisma.task.groupBy({
    by: ['userId'],
    where: {
      userId: { in: userIds },
      isBlueprint: false,
      startAt: { gte: filter.startDate },
      endAt: { lte: filter.endDate }
    }
  })

  const plannedUserIds = new Set(usersWithPlans.map(u => u.userId))

  return users.filter(u => !plannedUserIds.has(u.id))
}

export async function getRecurringTaskStats(currentUser: any, filter: ReportFilter) {
  const userIds = await getAuthorizedUserIdsForReport(currentUser, filter)
  if (userIds.length === 0) return []

  // Get all recurring task occurrences in this period
  const tasks = await prisma.task.findMany({
    where: {
      userId: { in: userIds },
      isBlueprint: false,
      recurrenceId: { not: null },
      startAt: { gte: filter.startDate },
      endAt: { lte: filter.endDate }
    },
    include: { recurrence: true, user: { select: { name: true } } }
  })

  // Group by title + recurrenceId
  const rMap: Record<string, { title: string, owner: string, occurrences: number, completed: number, skipped: number, overdue: number }> = {}

  const now = new Date()

  for (const t of tasks) {
    const key = `${t.recurrenceId}-${t.title}`
    if (!rMap[key]) {
      rMap[key] = {
        title: t.title,
        owner: t.user.name,
        occurrences: 0,
        completed: 0,
        skipped: 0,
        overdue: 0
      }
    }

    rMap[key].occurrences++
    if (t.status === "COMPLETED") rMap[key].completed++
    if (t.isSkipped) rMap[key].skipped++
    if (t.status !== "COMPLETED" && t.dueDate && t.dueDate < now) rMap[key].overdue++
  }

  return Object.values(rMap).sort((a, b) => b.occurrences - a.occurrences)
}
