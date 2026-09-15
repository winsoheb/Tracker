"use server"

import { prisma } from "@/lib/prisma"

async function getUserId() {
  const user = await prisma.user.findFirst()
  if (!user) throw new Error("No user found")
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

  return {
    entries,
    totalSeconds,
    categories,
    byCategory: Object.entries(byCategory)
      .map(([name, duration]) => ({ name, duration }))
      .sort((a, b) => b.duration - a.duration)
  }
}
