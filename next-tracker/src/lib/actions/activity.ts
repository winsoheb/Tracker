"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-utils"

async function getUserId() {
  const user = await requireAuth()
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
