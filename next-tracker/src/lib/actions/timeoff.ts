"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getUserTimeOffs(userId: string, month: number, year: number) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  
  return await prisma.timeOff.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      }
    },
    orderBy: { date: "asc" }
  })
}

export async function addTimeOff(data: { userId: string, date: Date, type: string, reason?: string }) {
  try {
    const existing = await prisma.timeOff.findFirst({
      where: {
        userId: data.userId,
        date: data.date
      }
    })

    if (existing) {
      await prisma.timeOff.update({
        where: { id: existing.id },
        data: {
          type: data.type,
          reason: data.reason,
        }
      })
    } else {
      await prisma.timeOff.create({
        data: {
          userId: data.userId,
          date: data.date,
          type: data.type,
          reason: data.reason,
          status: "APPROVED"
        }
      })
    }

    revalidatePath("/profile")
    revalidatePath("/reports/team")
    return { success: true }
  } catch (error) {
    console.error("Error adding time off:", error)
    return { success: false, error: "Failed to save time off." }
  }
}

export async function deleteTimeOff(id: string) {
  try {
    await prisma.timeOff.delete({ where: { id } })
    revalidatePath("/profile")
    revalidatePath("/reports/team")
    return { success: true }
  } catch (error) {
    console.error("Error deleting time off:", error)
    return { success: false, error: "Failed to delete time off." }
  }
}
