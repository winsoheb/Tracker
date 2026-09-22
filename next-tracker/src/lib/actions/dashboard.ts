"use server"

import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay, subDays } from "date-fns"
import { requireAuth } from "@/lib/auth-utils"

async function getUserId() {
  const user = await requireAuth()
  return user.id
}

export async function getDashboardData() {
  const userId = await getUserId()
  const todayStart = startOfDay(new Date())
  const todayEnd = endOfDay(new Date())

  // Get user settings for daily goal
  const settings = await prisma.setting.findUnique({
    where: { userId }
  })
  const dailyGoalHours = settings?.dailyGoalHours || 8
  const dailyGoalSeconds = dailyGoalHours * 3600

  // Get today's time entries
  const todaysEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      startedAt: {
        gte: todayStart,
        lte: todayEnd
      }
    },
    include: {
      category: true,
      project: true
    },
    orderBy: {
      startedAt: 'desc'
    }
  })

  // Calculate today's total time
  const todaysTotalSeconds = todaysEntries.reduce((total, entry) => total + entry.duration, 0)

  // Get last 7 days data for the chart
  const sevenDaysAgo = subDays(todayStart, 6)
  
  const weeklyEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      startedAt: {
        gte: sevenDaysAgo,
        lte: todayEnd
      }
    },
    include: {
      category: true
    }
  })

  // Group by day for the chart
  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const dayStart = subDays(todayStart, i)
    const dayEnd = endOfDay(dayStart)
    
    const dayEntries = weeklyEntries.filter(e => 
      e.startedAt >= dayStart && e.startedAt <= dayEnd
    )
    
    // Group by category for stacked bar chart
    const categoryBreakdown: Record<string, number> = {}
    dayEntries.forEach(entry => {
      const catName = entry.category?.name || 'Uncategorized'
      categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + (entry.duration / 3600) // Hours
    })

    const totalHours = dayEntries.reduce((sum, e) => sum + (e.duration / 3600), 0)

    chartData.push({
      date: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
      total: Number(totalHours.toFixed(1)),
      ...categoryBreakdown
    })
  }

  // Categories summary for today
  const categorySummary = todaysEntries.reduce((acc, entry) => {
    const cat = entry.category?.name || 'Uncategorized'
    if (!acc[cat]) {
      acc[cat] = { name: cat, color: entry.category?.color || '#3b82f6', duration: 0 }
    }
    acc[cat].duration += entry.duration
    return acc
  }, {} as Record<string, { name: string, color: string, duration: number }>)

  const sortedCategories = Object.values(categorySummary)
    .sort((a, b) => b.duration - a.duration)

  // Fetch all user categories for the timer dropdown
  const allCategories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  })

  return {
    dailyGoalSeconds,
    todaysTotalSeconds,
    todaysEntries,
    chartData,
    categorySummary: sortedCategories,
    categories: allCategories
  }
}
