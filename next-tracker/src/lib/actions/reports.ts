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
    where: { userId, isActive: true },
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
