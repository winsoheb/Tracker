"use server"

import { prisma } from "@/lib/prisma"

import { requireAuth } from "@/lib/auth-utils"
import { format } from "date-fns"

async function getUserId() {
  const user = await requireAuth()
  return user.id
}

export async function getReports(filter: {
  startDate?: Date,
  endDate?: Date,
  categoryId?: string,
  projectId?: string
}) {
  const userId = await getUserId()

  const whereClause: any = { userId }
  
  if (filter.startDate && filter.endDate) {
    whereClause.startedAt = {
      gte: filter.startDate,
      lte: filter.endDate
    }
  }

  if (filter.categoryId && filter.categoryId !== "ALL") {
    whereClause.categoryId = filter.categoryId
  }

  if (filter.projectId && filter.projectId !== "ALL") {
    whereClause.projectId = filter.projectId
  }

  const entries = await prisma.timeEntry.findMany({
    where: whereClause,
    include: {
      category: true,
      project: true
    },
    orderBy: {
      startedAt: "desc"
    }
  })

  // Summary logic
  const totalSeconds = entries.reduce((acc, e) => acc + e.duration, 0)
  
  const byCategory = entries.reduce((acc, e) => {
    const cat = e.category?.name || "Uncategorized"
    acc[cat] = (acc[cat] || 0) + e.duration
    return acc
  }, {} as Record<string, number>)

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })

  const settings = await prisma.setting.findUnique({
    where: { userId }
  })
  
  const dailyGoal = settings?.dailyGoalHours || 8

  // Calculate efficiency data (group entries by day)
  const groupedByDay = entries.reduce((acc, e) => {
    const day = format(e.startedAt, "MMM dd")
    acc[day] = (acc[day] || 0) + e.duration
    return acc
  }, {} as Record<string, number>)

  // Generate continuous dates for the chart
  const { eachDayOfInterval, startOfDay, endOfDay } = require('date-fns')
  
  let chartStartDate = filter.startDate
  let chartEndDate = filter.endDate

  if (!chartStartDate || !chartEndDate) {
    if (entries.length > 0) {
      const dates = entries.map((e: any) => e.startedAt)
      chartStartDate = startOfDay(new Date(Math.min(...dates.map((d: any) => d.getTime()))))
      chartEndDate = endOfDay(new Date())
    } else {
      chartStartDate = startOfDay(new Date())
      chartEndDate = endOfDay(new Date())
    }
  }

  let intervalDays: Date[] = []
  if (chartStartDate && chartEndDate) {
    const MAX_DAYS = 31;
    let start = chartStartDate
    const end = chartEndDate
    const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > MAX_DAYS) {
      start = new Date(end.getTime() - MAX_DAYS * 24 * 60 * 60 * 1000)
    }
    try {
      intervalDays = eachDayOfInterval({ start, end })
    } catch(e) {
      intervalDays = [new Date()]
    }
  } else {
    intervalDays = [new Date()]
  }

  const efficiencyData = intervalDays.map((date: Date) => {
    const dateStr = format(date, "MMM dd")
    const duration = groupedByDay[dateStr] || 0
    return {
      date: dateStr,
      hoursWorked: +(duration / 3600).toFixed(1),
      dailyGoal
    }
  })

  return {
    entries,
    totalSeconds,
    categories,
    efficiencyData,
    byCategory: Object.entries(byCategory)
      .map(([name, duration]) => ({ name, duration }))
      .sort((a, b) => b.duration - a.duration)
  }
}

export async function getTeamReports(month: number, year: number, workingDays: number) {
  const currentUser = await requireAuth()
  if (currentUser.role !== "MANAGER" && currentUser.role !== "ADMIN") {
    throw new Error("Forbidden")
  }

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true }
  })

  const entries = await prisma.timeEntry.findMany({
    where: { startedAt: { gte: startDate, lte: endDate } },
    include: { category: true, user: true }
  })

  const tasks = await prisma.task.findMany({
    where: { 
      startAt: { gte: startDate, lte: endDate },
      isBlueprint: false
    },
    include: { user: true, project: true }
  })

  const totalSeconds = entries.reduce((acc, e) => acc + e.duration, 0)
  const totalHours = totalSeconds / 3600

  const avgHoursPerPersonPerDay = (totalHours / Math.max(users.length, 1)) / Math.max(workingDays, 1)
  const standardHoursPerDay = 8
  const teamUtilizationPercent = avgHoursPerPersonPerDay / standardHoursPerDay

  // Hours by Employee
  const employeeStats = users.map(u => {
    const userEntries = entries.filter(e => e.userId === u.id)
    const userTasks = tasks.filter(t => t.userId === u.id)
    const uTotalSeconds = userEntries.reduce((acc, e) => acc + e.duration, 0)
    const uTotalHours = uTotalSeconds / 3600
    const uAvgHrsDay = uTotalHours / Math.max(workingDays, 1)
    const uUtilization = uAvgHrsDay / standardHoursPerDay
    
    return {
      id: u.id,
      name: u.name,
      role: u.role,
      totalHours: uTotalHours,
      tasksLogged: userTasks.length,
      avgHrsDay: uAvgHrsDay,
      utilization: uUtilization
    }
  })

  // Hours by Category
  const categoryStatsRaw = entries.reduce((acc, e) => {
    const cat = e.category?.name || "Uncategorized"
    acc[cat] = (acc[cat] || 0) + e.duration
    return acc
  }, {} as Record<string, number>)

  const categoryStats = Object.entries(categoryStatsRaw).map(([name, duration]) => ({
    name,
    totalHours: duration / 3600,
    percentOfTotal: (duration / 3600) / (totalHours || 1)
  }))

  return {
    totalHours,
    totalTasks: tasks.length,
    avgHoursPerPersonPerDay,
    teamUtilizationPercent,
    employeeStats,
    categoryStats,
    tasks,
    users
  }
}

