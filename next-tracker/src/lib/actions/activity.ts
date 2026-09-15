"use server"

import { prisma } from "@/lib/prisma"

async function getUserId() {
  const user = await prisma.user.findFirst()
  if (!user) throw new Error("No user found")
  return user.id
}

export async function logActivity(type: string, entity: string, entityId: string, details?: string) {
  try {
    const userId = await getUserId()
    await prisma.activityEvent.create({
      data: {
        userId,
        type,
        entity,
        entityId,
        details
      }
    })
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}

export async function getActivityLogs(limit = 50) {
  const userId = await getUserId()
  
  return await prisma.activityEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
}
